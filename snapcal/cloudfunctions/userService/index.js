/**
 * userService 云函数
 * 用户管理服务：创建/更新/获取用户档案
 */

// 引入DBAdapter和初始化工具
const { DBAdapter, initCloud } = require('./dbAdapter')

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
    // 初始化云环境 (上下文注入)
    const { cloud, db: rawDb } = initCloud(event)

    const { action, data } = event
    const wxContext = cloud.getWXContext()
    let openid = wxContext.OPENID

    // 读取环境参数（前端通过__env注入）
    const env = event.__env || 'dev'
    // 使用已初始化的 db 实例
    const db = new DBAdapter(rawDb, env)

    // [Fix] 开发环境备用鉴权逻辑：解决本地调试或跨账号调用丢失上下文的问题
    if (!openid && env === 'dev') {
        console.warn('[userService] 无法获取真实 OPENID，启用开发环境模拟身份')
        openid = event.userInfo?.openId || 'dev_mock_openid_001'
    }

    console.log(`[userService] action=${action}, openid=${openid}, env=${env}`)

    try {
        switch (action) {
            case 'createOrUpdateProfile':
                return await createOrUpdateProfile(db, openid, data)

            case 'getProfile':
                return await getProfile(db, openid)

            case 'calculateStats':
                return await calculateStats(data)

            default:
                return {
                    success: false,
                    error: `未知操作: ${action}`
                }
        }
    } catch (error) {
        console.error(`[userService] 错误:`, error)
        return {
            success: false,
            error: error.message || '服务器内部错误'
        }
    }
}

/**
 * 创建或更新用户档案
 */
async function createOrUpdateProfile(db, openid, userData) {
    if (!openid) {
        return { success: false, error: '无法获取用户标识' }
    }

    const collection = db.collection('users')
    const now = new Date()

    // 计算BMR、TDEE等
    const stats = calculateStatsInternal(userData)

    const profile = {
        ...userData,
        ...stats,
        openid,
        updatedAt: now
    }

    try {
        // 尝试更新
        const existing = await collection.where({ openid }).get()

        if (existing.data && existing.data.length > 0) {
            // 更新已存在的记录
            await collection.where({ openid }).update({
                data: profile
            })
            console.log(`[userService] 更新用户档案: ${openid}`)
        } else {
            // 创建新记录
            profile.createdAt = now
            await collection.add({ data: profile })
            console.log(`[userService] 创建用户档案: ${openid}`)
        }

        return {
            success: true,
            data: profile
        }
    } catch (error) {
        console.error(`[userService] 保存档案失败:`, error)
        return {
            success: false,
            error: `保存档案失败: ${error.message}`
        }
    }
}

/**
 * 获取用户档案
 */
async function getProfile(db, openid) {
    if (!openid) {
        return { success: false, error: '无法获取用户标识' }
    }

    const collection = db.collection('users')

    try {
        const result = await collection.where({ openid }).get()

        if (result.data && result.data.length > 0) {
            return {
                success: true,
                data: result.data[0]
            }
        } else {
            return {
                success: false,
                error: '用户档案不存在'
            }
        }
    } catch (error) {
        console.error(`[userService] 获取档案失败:`, error)
        return {
            success: false,
            error: '获取档案失败'
        }
    }
}

/**
 * 计算用户统计数据
 */
async function calculateStats(userData) {
    const stats = calculateStatsInternal(userData)
    return {
        success: true,
        data: stats
    }
}

/**
 * 内部计算函数
 * 使用Mifflin-St Jeor公式计算BMR
 */
function calculateStatsInternal(userData) {
    const { gender, weight, height, age, activityLevel, goal, dietPreference } = userData

    // 1. 计算BMR (基础代谢率) - Mifflin-St Jeor公式
    let bmr
    if (gender === '男') {
        bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    } else {
        bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
    }

    // 2. 活动系数
    const activityMultipliers = {
        'sedentary': 1.2,        // 久坐
        'lightlyActive': 1.375,  // 轻度活动
        'moderatelyActive': 1.55, // 中度活动
        'veryActive': 1.725,     // 重度活动
        'extraActive': 1.9       // 极度活动
    }

    const multiplier = activityMultipliers[activityLevel] || 1.375
    const tdee = Math.round(bmr * multiplier)

    // 3. 根据目标调整热量
    let targetCalories = tdee
    if (goal === '减脂') {
        targetCalories = tdee - 500 // 每日减少500kcal
    } else if (goal === '增肌') {
        targetCalories = tdee + 300 // 每日增加300kcal
    }

    // 4. 根据饮食偏好计算营养比例
    let proteinRatio, fatRatio, carbsRatio

    switch (dietPreference) {
        case 'vegan':
            proteinRatio = 0.15
            fatRatio = 0.30
            carbsRatio = 0.55
            break
        case 'lowCarb':
            proteinRatio = 0.25
            fatRatio = 0.40
            carbsRatio = 0.35
            break
        case 'highProtein':
            proteinRatio = 0.35
            fatRatio = 0.25
            carbsRatio = 0.40
            break
        case 'balanced':
        default:
            proteinRatio = 0.25
            fatRatio = 0.30
            carbsRatio = 0.45
            break
    }

    // 5. 计算各营养素克数
    // 蛋白质和碳水: 4kcal/g，脂肪: 9kcal/g
    const targetProtein = Math.round((targetCalories * proteinRatio) / 4)
    const targetFat = Math.round((targetCalories * fatRatio) / 9)
    const targetCarbs = Math.round((targetCalories * carbsRatio) / 4)

    return {
        bmr,
        tdee,
        targetCalories,
        targetProtein,
        targetFat,
        targetCarbs
    }
}
