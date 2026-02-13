/**
 * 云开发 API 封装
 * 功能：使用跨账号云实例进行云函数调用
 */

/**
 * 调用云函数（使用跨账号云实例）
 * @param {string} name - 云函数名称
 * @param {object} data - 传递的数据
 * @returns {Promise} 云函数返回结果
 */
export async function call(name, data = {}) {
    const app = getApp()

    // 等待并获取跨账号云实例
    const cloud = await app.getCloud()

    // 获取当前运行环境
    const envVersion = wx.getAccountInfoSync().miniProgram.envVersion

    // 自动注入环境参数
    // develop/trial -> dev, release -> prod
    // 这只用于业务逻辑判断（如集合前缀），不影响底层连接
    data.__env = envVersion === 'release' ? 'prod' : 'dev'

    // 注入请求ID，便于云端幂等和日志追踪
    if (!data.requestId) {
        data.requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }

    console.log(`[云函数调用] ${name}`, {
        env: data.__env,
        envVersion,
        data
    })

    try {
        const result = await cloud.callFunction({
            name,
            data,
        })

        return result.result
    } catch (error) {
        console.error(`[云函数调用失败] ${name}`, error)
        throw error
    }
}

/**
 * 获取友好的环境名称
 */
export function getEnvLabel() {
    const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
    switch (envVersion) {
        case 'develop': return '开发版'
        case 'trial': return '体验版'
        case 'release': return '正式版'
        default: return envVersion
    }
}

/**
 * 获取共享云实例 (用于 uploadFile 等非云函数操作)
 */
export async function initSharedCloud() {
    const app = getApp()
    return await app.getCloud()
}
