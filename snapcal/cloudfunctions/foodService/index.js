/**
 * foodService 云函数
 * 饮食记录管理服务
 */

// 引入DBAdapter和初始化工具
const { DBAdapter, initCloud } = require('./dbAdapter')

exports.main = async (event, context) => {
    // 初始化云环境
    const { cloud, db: rawDb } = initCloud(event)

    const { action, data } = event
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 读取环境参数（前端通过__env注入）
    const env = event.__env || 'dev'
    const db = new DBAdapter(rawDb, env)

    console.log(`[foodService] action=${action}, openid=${openid}`)

    try {
        switch (action) {
            case 'addEntry':
                return await addEntry(db, openid, data)

            case 'getEntries':
                return await getEntries(db, openid, data)

            case 'getDailyStats':
                return await getDailyStats(db, openid, data)

            case 'getMonthlyStats':
                return await getMonthlyStats(db, openid, data)

            case 'deleteEntry':
                return await deleteEntry(db, openid, data)

            case 'updateEntry':
                return await updateEntry(db, openid, data)

            default:
                return { success: false, error: `未知操作: ${action}` }
        }
    } catch (error) {
        console.error(`[foodService] 错误:`, error)
        return { success: false, error: error.message }
    }
}

/**
 * 添加饮食记录
 */
async function addEntry(db, openid, data) {
    const { date, meal, name, calories, protein, carbs, fat, imageUrl } = data

    if (!date || !meal || !name) {
        return { success: false, error: '缺少必要参数' }
    }

    const collection = db.collection('food_entries')
    const entry = {
        openid,
        date,
        meal,
        name,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        imageUrl: imageUrl || '',
        createdAt: new Date()
    }

    const result = await collection.add({ data: entry })
    console.log(`[foodService] 添加记录: ${result._id}`)

    return {
        success: true,
        data: { _id: result._id, ...entry }
    }
}

/**
 * 获取饮食记录
 */
async function getEntries(db, openid, data) {
    const { date, meal } = data
    const collection = db.collection('food_entries')

    let query = { openid }
    if (date) query.date = date
    if (meal) query.meal = meal

    const result = await collection
        .where(query)
        .orderBy('createdAt', 'desc')
        .get()

    return {
        success: true,
        data: result.data
    }
}

/**
 * 获取每日统计
 */
async function getDailyStats(db, openid, data) {
    const { date } = data
    if (!date) {
        return { success: false, error: '缺少日期参数' }
    }

    const collection = db.collection('food_entries')
    const result = await collection.where({ openid, date }).get()

    const entries = result.data
    const stats = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        meals: {
            '早餐': [],
            '午餐': [],
            '晚餐': [],
            '加餐': []
        }
    }

    entries.forEach(entry => {
        stats.totalCalories += entry.calories || 0
        stats.totalProtein += entry.protein || 0
        stats.totalCarbs += entry.carbs || 0
        stats.totalFat += entry.fat || 0

        if (stats.meals[entry.meal]) {
            stats.meals[entry.meal].push(entry)
        }
    })

    return {
        success: true,
        data: stats
    }
}


/**
 * 获取月度统计
 */
async function getMonthlyStats(db, openid, data) {
    const { year, month } = data
    if (!year || !month) {
        return { success: false, error: '缺少年月参数' }
    }

    const startStr = `${year}-${String(month).padStart(2, '0')}-01`
    // 计算下个月初作为结束界限，或者直接计算当月最后一天
    // 简单方式：字符串比较 'YYYY-MM-01' <= date <= 'YYYY-MM-31'
    const endStr = `${year}-${String(month).padStart(2, '0')}-31`

    const collection = db.collection('food_entries')
    const _ = db.command

    // 获取当月所有记录 (最多1000条，一般够用)
    const result = await collection
        .where({
            openid,
            date: _.gte(startStr).and(_.lte(endStr))
        })
        .limit(1000)
        .get()

    const entries = result.data

    // 聚合统计
    let totalCalories = 0
    let daysSet = new Set()

    entries.forEach(entry => {
        totalCalories += entry.calories || 0
        daysSet.add(entry.date)
    })

    return {
        success: true,
        data: {
            totalCalories,
            avgCalories: daysSet.size > 0 ? Math.round(totalCalories / daysSet.size) : 0,
            loggedDays: daysSet.size,
            entries: entries // 返回详情以便前端计算其他宏量元素
        }
    }
}

/**
 * 删除记录
 */
async function deleteEntry(db, openid, data) {
    const { entryId } = data
    if (!entryId) {
        return { success: false, error: '缺少记录ID' }
    }

    const collection = db.collection('food_entries')
    await collection.doc(entryId).remove()

    return { success: true }
}

/**
 * 更新记录
 */
async function updateEntry(db, openid, data) {
    const { entryId, ...updateData } = data
    if (!entryId) {
        return { success: false, error: '缺少记录ID' }
    }

    const collection = db.collection('food_entries')
    await collection.doc(entryId).update({
        data: { ...updateData, updatedAt: new Date() }
    })

    return { success: true }
}
