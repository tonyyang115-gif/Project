Page({
    data: {
        appName: 'SnapCal',
        slogan: '轻松记录，健康生活',
        agreed: false,
        showAgreement: false,
        showPrivacy: false
    },

    onLoad() {
        console.log('[Landing] 页面加载')
        // 检查是否已有用户档案
        const userProfile = wx.getStorageSync('userProfile')
        if (userProfile && userProfile.name) {
            console.log('[Landing] 已有用户档案，跳转到Dashboard')
            wx.redirectTo({
                url: '/pages/dashboard/index'
            })
        }
    },

    /**
     * 切换同意状态
     */
    toggleAgreed() {
        this.setData({
            agreed: !this.data.agreed
        })
    },

    /**
     * 显示用户协议
     */
    showAgreementModal() {
        this.setData({
            showAgreement: true
        })
    },

    /**
     * 显示隐私政策
     */
    showPrivacyModal() {
        this.setData({
            showPrivacy: true
        })
    },

    /**
     * 关闭用户协议弹窗
     */
    closeAgreement() {
        this.setData({
            showAgreement: false
        })
    },

    /**
     * 关闭隐私政策弹窗
     */
    closePrivacy() {
        this.setData({
            showPrivacy: false
        })
    },

    /**
     * 开始使用
     */
    handleStart() {
        if (!this.data.agreed) {
            wx.showToast({
                title: '请先同意协议',
                icon: 'none'
            })
            return
        }

        console.log('[Landing] 用户开始使用，跳转到Onboarding')
        wx.navigateTo({
            url: '/pages/onboarding/index'
        })
    },

    /**
     * 登录
     */
    handleLogin() {
        wx.showToast({
            title: '登录功能开发中',
            icon: 'none'
        })
    },

    // ========== 滚动穿透处理 ==========
    preventScroll: function () {
        return;
    }
})
