/**
 * exerciseService 云函数
 * 运动记录管理服务
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

    console.log(`[exerciseService] action=${action}, openid=${openid}`)

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

            default:
                return { success: false, error: `未知操作: ${action}` }
        }
    } catch (error) {
        console.error(`[exerciseService] 错误:`, error)
        return { success: false, error: error.message }
    }
}

/**
 * 添加运动记录
 */
async function addEntry(db, openid, data) {
    // 支持type和name两种参数名
    const { date, type, name, duration, calories, icon } = data
    const exerciseName = type || name

    if (!date || !exerciseName) {
        return { success: false, error: '缺少必要参数' }
    }

    const collection = db.collection('exercise_entries')
    const entry = {
        openid,
        date,
        name: exerciseName,
        icon: icon || '', // 保存图标
        duration: duration || 0,
        calories: calories || 0,
        createdAt: new Date()
    }

    const result = await collection.add({ data: entry })
    console.log(`[exerciseService] 添加记录: ${result._id}`)

    return {
        success: true,
        data: { _id: result._id, ...entry }
    }
}

/**
 * 获取运动记录
 */
async function getEntries(db, openid, data) {
    const { date } = data
    const collection = db.collection('exercise_entries')

    let query = { openid }
    if (date) query.date = date

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
 * 获取每日运动统计
 */
async function getDailyStats(db, openid, data) {
    const { date } = data
    if (!date) {
        return { success: false, error: '缺少日期参数' }
    }

    const collection = db.collection('exercise_entries')
    const result = await collection.where({ openid, date }).get()

    const entries = result.data
    const stats = {
        totalCalories: 0,
        totalDuration: 0,
        count: entries.length,
        entries: entries
    }

    entries.forEach(entry => {
        stats.totalCalories += entry.calories || 0
        stats.totalDuration += entry.duration || 0
    })

    return {
        success: true,
        data: stats
    }
}


/**
 * 获取月度运动统计
 */
async function getMonthlyStats(db, openid, data) {
    const { year, month } = data
    if (!year || !month) {
        return { success: false, error: '缺少年月参数' }
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const startStr = `${monthStr}-01`
    const endStr = `${monthStr}-31`
    const collection = db.collection('exercise_entries')
    const _ = db.command

    const result = await collection
        .where({
            openid,
            date: _.gte(startStr).and(_.lte(endStr))
        })
        .limit(1000)
        .get()

    const entries = result.data

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
            loggedDays: daysSet.size,
            entries
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

    const collection = db.collection('exercise_entries')
    await collection.doc(entryId).remove()

    return { success: true }
}
