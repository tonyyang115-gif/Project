import { cloud_env } from './config'
import StateManager from './utils/stateManager'

App({
    globalData: {
        version: '1.0.0',
        userInfo: null,
        envLabel: '',
        // 跨账号云实例
        cloud: null,
        cloudReady: false,
        // 全局状态管理器
        stateManager: new StateManager({
            userInfo: null,
            isLoading: false,
            syncStatus: 'idle',  // idle / syncing / success / error
            offlineQueue: []
        })
    },

    async onLaunch() {
        console.error('🔥🔥🔥 ANTIGRAVITY CONNECTION CHECK: CODE IS UPDATED 🔥🔥🔥')
        console.log('[App] 启动 SnapCal v' + this.globalData.version)

        // 初始化跨账号云环境
        try {
            await this.initCloud()
            this.globalData.envLabel = this.getEnvLabel()
            console.log('[App] 跨账号云开发初始化成功', this.globalData.envLabel)
        } catch (error) {
            console.error('[App] 云开发初始化失败', error)
            wx.showToast({
                title: '云环境初始化失败',
                icon: 'none',
                duration: 3000
            })
        }
    },

    /**
     * 初始化跨账号云实例
     */
    async initCloud() {
        try {
            // 创建新的 Cloud 实例用于跨账号调用
            const cloudInstance = new wx.cloud.Cloud({
                resourceAppid: cloud_env.resourceAppid,
                resourceEnv: cloud_env.resourceEnv,
            })

            // 必须等待 init 完成
            await cloudInstance.init()

            // 保存到全局
            this.globalData.cloud = cloudInstance
            this.globalData.cloudReady = true

            console.log('[Cloud] 跨账号云开发实例初始化成功', {
                resourceAppid: cloud_env.resourceAppid,
                resourceEnv: cloud_env.resourceEnv
            })

            return cloudInstance
        } catch (error) {
            console.error('[Cloud] 初始化失败:', error)
            throw error
        }
    },

    /**
     * 获取 Cloud 实例（等待初始化完成）
     */
    async getCloud() {
        if (this.globalData.cloudReady) {
            return this.globalData.cloud
        }
        // 等待初始化完成
        await new Promise(resolve => setTimeout(resolve, 100))
        return this.getCloud()
    },

    /**
     * 获取友好的环境名称
     */
    getEnvLabel() {
        const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
        switch (envVersion) {
            case 'develop': return '开发版'
            case 'trial': return '体验版'
            case 'release': return '正式版'
            default: return envVersion
        }
    },

    onShow() {
        console.log('[App] 前台显示')
    },

    onHide() {
        console.log('[App] 后台隐藏')
    },

    onError(error) {
        console.error('[App] 全局错误', error)

        // 简单的错误提示
        wx.showToast({
            title: '程序发生错误',
            icon: 'none',
            duration: 2000
        })
    },

    onUnhandledRejection(res) {
        console.error('[App] 未处理的Promise拒绝', res.reason)
    }
})
