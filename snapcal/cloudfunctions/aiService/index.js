// 引入DBAdapter和初始化工具
const { DBAdapter, initCloud } = require('./dbAdapter')
const { QwenProvider } = require('./ai/qwenProvider')

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
    const { imageUrl } = data

    if (!imageUrl) throw new Error('缺少图片')

    // 处理 cloud:// 链接
    let targetUrl = imageUrl
    if (imageUrl.startsWith('cloud://')) {
        const res = await cloud.getTempFileURL({ fileList: [imageUrl] })
        if (res.fileList?.[0]?.tempFileURL) targetUrl = res.fileList[0].tempFileURL
    }

    if (!QWEN_API_KEY) throw new Error('API Key未配置')

    const qwen = new QwenProvider(QWEN_API_KEY)

    const startTime = Date.now()
    const result = await qwen.analyzeIngredientImage(targetUrl)
    const duration = Date.now() - startTime

    await logAIUsage(db, {
        openid,
        action: 'analyzeIngredients',
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
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            }
        })
    } catch (error) {
        console.error('[aiService] 记录AI使用失败', error)
        // 不抛出错误，避免影响主流程
    }
}
