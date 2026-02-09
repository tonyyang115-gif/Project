/**
 * 数据库适配器 - 云函数端
 * 功能:自动添加环境前缀，统一数据库操作
 */
const cloud = require('wx-server-sdk')

// 强制硬编码环境ID - 本地调试救星
const FORCE_ENV_ID = 'cloud1-7go9rrf32b9c9cbc'

/**
 * 统一初始化云环境
 * @param {object} event - 云函数调用的 event 参数
 */
function initCloud(event = {}) {
    // 策略修改：优先使用硬编码ID，确保本地调试绝对能连上
    const envId = FORCE_ENV_ID

    // 初始化云环境 (try-catch 避免重复初始化报错)
    try {
        cloud.init({
            env: envId
        })
    } catch (e) {
        // ignore
    }

    console.log(`[initCloud] Force Env Init: ${envId}`)

    return {
        cloud,
        // 关键修复：cloud.database() 不传 env 参数，让它继承 cloud.init 的配置
        db: cloud.database(),
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

        // 前缀逻辑保持不变
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
