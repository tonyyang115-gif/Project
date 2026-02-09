/**
 * 数据库适配器 - 云函数端
 * 功能：自动添加环境前缀，统一数据库操作
 * 参考：快乐打牌记_2/Minapp/cloudfunctions/createRoom/index.js
 */
const cloud = require('wx-server-sdk')

/**
 * 统一初始化云环境
 * @param {object} event - 云函数调用的 event 参数
 */
function initCloud(event = {}) {
    // 参考快乐打牌记：
    // 1. 初始化使用 DYNAMIC_CURRENT_ENV
    // 2. 前缀逻辑依赖前端传来的 __env (dev/prod)

    // 初始化云环境 (try-catch 避免重复初始化报错)
    try {
        cloud.init({
            env: cloud.DYNAMIC_CURRENT_ENV
        })
    } catch (e) {
        // ignore
    }

    // 调试日志
    try {
        const sdkEnv = cloud.getWXContext().ENV
        console.log(`[initCloud] SDK Context ENV: ${sdkEnv}`)
    } catch (e) { }

    return {
        cloud,
        db: cloud.database(),
        // 传递 event 给 DBAdapter 构造函数用
        event
    }
}

class DBAdapter {
    /**
     * @param {object} db - 数据库实例
     * @param {string} env - 环境标识 ('prod' | 'dev') 来源于 event.__env
     */
    constructor(db, env = 'release') {
        this.db = db
        this._ = this.db.command

        // 快乐打牌记逻辑：env === 'dev' 时加前缀
        this.envPrefix = (env === 'dev') ? 'dev_' : ''

        console.log(`[DBAdapter] 初始化, 逻辑环境: ${env}, 前缀: ${this.envPrefix}`)
    }

    /**
     * 获取集合（自动添加环境前缀）
     * @param {string} name - 集合基础名称
     * @returns {Collection} 数据库集合
     */
    collection(name) {
        const collectionName = this.envPrefix + name
        console.log(`[DBAdapter] 访问集合: ${collectionName}`)
        return this.db.collection(collectionName)
    }

    /**
     * 获取 command 对象
     * @returns {Command} 数据库命令对象
     */
    get command() {
        return this._
    }

    /**
     * 聚合查询
     * @param {string} name - 集合名称
     * @returns {Aggregate} 聚合对象
     */
    aggregate(name) {
        return this.collection(name).aggregate()
    }
}

module.exports = { DBAdapter, initCloud }
