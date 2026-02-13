// 引入DBAdapter和初始化工具
const { DBAdapter, initCloud } = require('./dbAdapter')
const { QwenProvider } = require('./ai/qwenProvider')

const INGREDIENT_RISK_LEVELS = new Set(['low', 'medium', 'high'])
const INGREDIENT_TYPES = new Set(['common', 'additive', 'allergen', 'sugar', 'fat'])
const RATE_LIMIT_PER_MINUTE = 6
const DAILY_QUOTA_LIMIT = 80
const CACHE_TTL_MS = 10 * 60 * 1000

/**
 * 从环境变量读取API Key
 * 优先级: 云端环境变量 > 本地 env.local.js
 */
let QWEN_API_KEY = process.env.QWEN_API_KEY

// 本地调试回退逻辑
if (!QWEN_API_KEY) {
    try {
        const localEnv = require('./env.local')
        if (localEnv && localEnv.QWEN_API_KEY) {
            QWEN_API_KEY = localEnv.QWEN_API_KEY
            console.log('[aiService] 🔧 已加载本地调试配置 env.local.js')
        }
    } catch (e) {
        // 忽略文件不存在错误
    }
}

// 启动时检查 (非阻塞)
if (!QWEN_API_KEY) {
    console.warn('[aiService] ⚠️ QWEN_API_KEY未配置，AI功能将无法使用。请在云控制台或本地调试配置中设置。')
} else {
    console.log('[aiService] ✅ API Key已加载')
}

/**
 * AI服务云函数
 * 功能：食物图片识别、配料表分析、营养分析
 */
exports.main = async (event, context) => {
    // 初始化云环境 (上下文注入)
    const { cloud, db: rawDb } = initCloud(event)

    // 初始化 Adapter
    const env = event.__env || 'dev'
    const db = new DBAdapter(rawDb, env)

    console.log('[aiService] 调用开始', {
        action: event.action,
        env: event.__env,
        hasApiKey: !!QWEN_API_KEY
    })

    const { OPENID, APPID, UNIONID } = cloud.getWXContext()

    try {
        // 根据action分发
        switch (event.action) {
            case 'analyzeFoodImage':
            case 'analyzeFood':  // 别名支持
                return await analyzeFoodImage(db, event, OPENID, cloud)

            case 'analyzeIngredients':
                return await analyzeIngredients(db, event, OPENID, cloud)

            case 'analyzeNutrition':
                return await analyzeNutrition(db, event, OPENID)

            default:
                return {
                    success: false,
                    code: 'INVALID_ACTION',
                    error: `未知的操作: ${event.action}`
                }
        }
    } catch (error) {
        console.error('[aiService] 执行错误', error)

        return {
            success: false,
            code: error.code || 'UNKNOWN_ERROR',
            error: error.message || '服务异常'
        }
    }
}

/**
 * 分析食物图片
 */
async function analyzeFoodImage(db, event, openid, cloud) {
    // 支持两种参数格式：event直接传入 或 event.data传入
    const data = event.data || event
    const { imageUrl, imageBase64 } = data

    if (!imageUrl && !imageBase64) {
        throw new Error('缺少图片参数')
    }

    // 处理 cloud:// 协议图片路径
    let targetUrl = imageUrl || imageBase64
    if (imageUrl && imageUrl.startsWith('cloud://')) {
        try {
            const res = await cloud.getTempFileURL({
                fileList: [imageUrl]
            })
            if (res.fileList && res.fileList[0].tempFileURL) {
                targetUrl = res.fileList[0].tempFileURL
                console.log('[aiService] ☁️ 已转换临时链接:', targetUrl)
            }
        } catch (e) {
            console.error('[aiService] 获取临时链接失败', e)
            // 继续尝试原链接（虽然大概率失败）
        }
    }

    // 初始化AI服务
    if (!QWEN_API_KEY) {
        throw new Error('服务未配置 QWEN_API_KEY，请联系管理员或查看控制台日志')
    }
    const qwen = new QwenProvider(QWEN_API_KEY)

    // 调用AI识别
    const startTime = Date.now()
    const result = await qwen.analyzeFoodImage(targetUrl)
    const duration = Date.now() - startTime

    // 记录AI使用情况
    await logAIUsage(db, {
        openid,
        action: 'analyzeFoodImage',
        success: true,
        duration,
        env: event.__env
    })

    return {
        success: true,
        data: result
    }
}

/**
 * 配料表分析
 */
async function analyzeIngredients(db, event, openid, cloud) {
    const data = event.data || event
    const { imageUrl, cleanupFileId } = data
    const requestId = data.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    let phase = 'validate'
    const startTime = Date.now()
    let providerLatency = null

    if (!imageUrl) {
        const error = new Error('缺少图片')
        error.code = 'INVALID_INPUT'
        throw error
    }

    const fileIdToCleanup = cleanupFileId || (imageUrl.startsWith('cloud://') ? imageUrl : null)
    const cacheKey = imageUrl

    try {
        phase = 'idempotency_check'
        const idempotentResult = await getIdempotentResult(db, openid, 'analyzeIngredients', requestId)
        if (idempotentResult) {
            return {
                success: true,
                data: idempotentResult,
                requestId,
                cached: true
            }
        }

        phase = 'cache_lookup'
        const cachedResult = await getRecentImageCache(db, openid, 'analyzeIngredients', cacheKey)
        if (cachedResult) {
            await saveIdempotentResult(db, openid, 'analyzeIngredients', requestId, cachedResult, true)
            return {
                success: true,
                data: cachedResult,
                requestId,
                cached: true
            }
        }

        phase = 'rate_limit'
        await enforceRateLimit(db, openid, 'analyzeIngredients')

        // 处理 cloud:// 链接
        phase = 'resolve_temp_url'
        let targetUrl = imageUrl
        if (imageUrl.startsWith('cloud://')) {
            const res = await cloud.getTempFileURL({ fileList: [imageUrl] })
            if (res.fileList?.[0]?.tempFileURL) {
                targetUrl = res.fileList[0].tempFileURL
            } else {
                const error = new Error('图片链接转换失败')
                error.code = 'TEMP_URL_RESOLVE_FAILED'
                throw error
            }
        }

        if (!QWEN_API_KEY) {
            const error = new Error('API Key未配置')
            error.code = 'CONFIG_MISSING'
            throw error
        }

        const qwen = new QwenProvider(QWEN_API_KEY)

        phase = 'provider_call'
        const providerStart = Date.now()
        const rawResult = await qwen.analyzeIngredientImage(targetUrl)
        providerLatency = Date.now() - providerStart

        phase = 'normalize_result'
        const normalizedResult = normalizeIngredientResult(rawResult)
        const duration = Date.now() - startTime

        phase = 'log_success'
        await logAIUsage(db, {
            openid,
            action: 'analyzeIngredients',
            success: true,
            duration,
            providerLatency,
            phase,
            requestId,
            env: event.__env
        })

        phase = 'cache_write'
        await saveImageCache(db, openid, 'analyzeIngredients', cacheKey, normalizedResult)
        await saveIdempotentResult(db, openid, 'analyzeIngredients', requestId, normalizedResult, false)

        return {
            success: true,
            data: normalizedResult,
            requestId
        }
    } catch (error) {
        const duration = Date.now() - startTime
        const errorCode = error.code || 'UNKNOWN_ERROR'

        await logAIUsage(db, {
            openid,
            action: 'analyzeIngredients',
            success: false,
            duration,
            providerLatency,
            phase,
            requestId,
            errorCode,
            errorMessage: error.message,
            env: event.__env
        })
        await saveIdempotentResult(db, openid, 'analyzeIngredients', requestId, null, false, errorCode, error.message)

        error.code = errorCode
        throw error
    } finally {
        await safeDeleteCloudFile(cloud, fileIdToCleanup)
    }
}

/**
 * 营养分析
 */
async function analyzeNutrition(db, event, openid) {
    // 支持两种参数格式：event直接传入 或 event.data传入
    const data = event.data || event
    const { foodName, quantity } = data

    if (!foodName) {
        throw new Error('缺少食物名称')
    }

    if (!QWEN_API_KEY) {
        throw new Error('服务未配置 QWEN_API_KEY')
    }

    const qwen = new QwenProvider(QWEN_API_KEY)

    const startTime = Date.now()
    const result = await qwen.analyzeNutrition(foodName, quantity)
    const duration = Date.now() - startTime

    await logAIUsage(db, {
        openid,
        action: 'analyzeNutrition',
        success: true,
        duration,
        env: event.__env
    })

    return {
        success: true,
        data: result
    }
}

/**
 * 记录AI使用日志
 */
async function logAIUsage(db, data) {
    try {
        await db.collection('ai_usage').add({
            data: {
                _openid: data.openid,
                action: data.action,
                success: data.success,
                duration: data.duration,
                providerLatency: data.providerLatency || null,
                phase: data.phase || null,
                requestId: data.requestId || null,
                errorCode: data.errorCode || null,
                errorMessage: data.errorMessage || null,
                env: data.env || null,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            }
        })
    } catch (error) {
        console.error('[aiService] 记录AI使用失败', error)
        // 不抛出错误，避免影响主流程
    }
}

function normalizeIngredientResult(raw) {
    const source = raw && typeof raw === 'object' ? raw : {}
    const ingredients = Array.isArray(source.ingredients)
        ? source.ingredients.map(normalizeIngredientItem).filter(Boolean)
        : []
    const additives = Array.isArray(source.additives)
        ? source.additives.map((item) => String(item || '').trim()).filter(Boolean)
        : []
    const suggestions = Array.isArray(source.suggestions)
        ? source.suggestions.map((item) => String(item || '').trim()).filter(Boolean)
        : []

    const normalizedRisk = normalizeRiskLevel(source.riskLevel)
    const highRiskInIngredients = ingredients.some((item) => item.riskLevel === 'high')
    const riskLevel = normalizedRisk || (highRiskInIngredients ? 'high' : 'low')

    return {
        productName: String(source.productName || '未知食品'),
        safetyScore: normalizeScore(source.safetyScore),
        riskLevel,
        summary: String(source.summary || '未识别到可用结论'),
        ingredients,
        additives,
        suggestions
    }
}

function normalizeIngredientItem(item) {
    if (!item || typeof item !== 'object') {
        return null
    }

    const name = String(item.name || '').trim()
    if (!name) {
        return null
    }

    const type = INGREDIENT_TYPES.has(item.type) ? item.type : 'common'
    const riskLevel = normalizeRiskLevel(item.riskLevel) || 'low'
    const description = String(item.description || '').trim()

    return {
        name,
        type,
        riskLevel,
        description
    }
}

function normalizeRiskLevel(level) {
    return INGREDIENT_RISK_LEVELS.has(level) ? level : null
}

function normalizeScore(score) {
    const value = Number(score)
    if (!Number.isFinite(value)) {
        return 60
    }
    return Math.max(0, Math.min(100, Math.round(value)))
}

async function safeDeleteCloudFile(cloud, fileID) {
    if (!fileID || typeof fileID !== 'string' || !fileID.startsWith('cloud://')) {
        return
    }

    try {
        await cloud.deleteFile({ fileList: [fileID] })
    } catch (error) {
        console.warn('[aiService] 临时图片清理失败', {
            fileID,
            message: error.message
        })
    }
}

async function enforceRateLimit(db, openid, action) {
    const now = Date.now()
    const windowStart = now - 60 * 1000
    const date = new Date().toISOString().split('T')[0]
    const command = db.command

    const minuteQuery = await db.collection('ai_usage')
        .where({
            _openid: openid,
            action,
            timestamp: command.gte(windowStart)
        })
        .count()

    if (minuteQuery.total >= RATE_LIMIT_PER_MINUTE) {
        const error = new Error('请求过于频繁，请稍后再试')
        error.code = 'RATE_LIMITED'
        throw error
    }

    const dailyQuery = await db.collection('ai_usage')
        .where({
            _openid: openid,
            action,
            date
        })
        .count()

    if (dailyQuery.total >= DAILY_QUOTA_LIMIT) {
        const error = new Error('今日识别次数已达上限，请明日再试')
        error.code = 'QUOTA_EXCEEDED'
        throw error
    }
}

async function getIdempotentResult(db, openid, action, requestId) {
    if (!requestId) return null

    try {
        const res = await db.collection('ai_idempotency')
            .where({ _openid: openid, action, requestId, success: true })
            .limit(1)
            .get()

        return res.data?.[0]?.result || null
    } catch (error) {
        console.warn('[aiService] 幂等查询失败', { requestId, message: error.message })
        return null
    }
}

async function saveIdempotentResult(db, openid, action, requestId, result, fromCache, errorCode, errorMessage) {
    if (!requestId) return

    const payload = {
        _openid: openid,
        action,
        requestId,
        success: !!result,
        result: result || null,
        fromCache: !!fromCache,
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        updatedAt: Date.now()
    }

    try {
        const existing = await db.collection('ai_idempotency')
            .where({ _openid: openid, action, requestId })
            .limit(1)
            .get()

        if (existing.data && existing.data[0]) {
            await db.collection('ai_idempotency').doc(existing.data[0]._id).update({ data: payload })
        } else {
            await db.collection('ai_idempotency').add({ data: payload })
        }
    } catch (error) {
        console.warn('[aiService] 幂等写入失败', { requestId, message: error.message })
    }
}

async function getRecentImageCache(db, openid, action, cacheKey) {
    if (!cacheKey) return null

    try {
        const command = db.command
        const res = await db.collection('ai_result_cache')
            .where({
                _openid: openid,
                action,
                cacheKey,
                expiresAt: command.gte(Date.now())
            })
            .limit(1)
            .get()

        return res.data?.[0]?.result || null
    } catch (error) {
        console.warn('[aiService] 缓存查询失败', { message: error.message })
        return null
    }
}

async function saveImageCache(db, openid, action, cacheKey, result) {
    if (!cacheKey || !result) return

    const payload = {
        _openid: openid,
        action,
        cacheKey,
        result,
        expiresAt: Date.now() + CACHE_TTL_MS,
        updatedAt: Date.now()
    }

    try {
        const existing = await db.collection('ai_result_cache')
            .where({ _openid: openid, action, cacheKey })
            .limit(1)
            .get()

        if (existing.data && existing.data[0]) {
            await db.collection('ai_result_cache').doc(existing.data[0]._id).update({ data: payload })
        } else {
            await db.collection('ai_result_cache').add({ data: payload })
        }
    } catch (error) {
        console.warn('[aiService] 缓存写入失败', { message: error.message })
    }
}
