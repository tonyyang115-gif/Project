/**
 * 数据库适配器 - 云函数端
 * 功能：自动添加环境前缀，统一数据库操作
 */

class DBAdapter {
    /**
     * @param {object} cloud - 云开发实例
     * @param {string} env - 环境标识 ('prod' | 'dev')
     */
    constructor(cloud, env = 'prod') {
        this.db = cloud.database()
        this._ = this.db.command
        this.env = env

        console.log(`[DBAdapter] 初始化，环境: ${env}`)
    }

    /**
     * 获取集合（自动添加环境前缀）
     * @param {string} name - 集合基础名称
     * @returns {Collection} 数据库集合
     */
    collection(name) {
        const prefix = this.env === 'prod' ? '' : 'dev_'
        const collectionName = prefix + name

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

module.exports = { DBAdapter }
