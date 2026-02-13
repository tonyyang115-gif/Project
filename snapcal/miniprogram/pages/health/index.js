/**
 * HealthTools健康工具页面
 */
Page({
    data: {
        // 组件可视状态
        showBMI: false,
        showBMR: false,
        showBMR: false,
        showHR: false,
        showWHR: false,
        showBFR: false,
        showRFM: false,
        showScanner: false,

        // 用户数据 (保持不变)
        user: {
            gender: '男',
            age: 28,
            height: 175,
            weight: 68
        }
    },

    onLoad() {
        this.loadUserProfile()
    },

    isUserCancelError(error) {
        const msg = String((error && (error.errMsg || error.message)) || '').toLowerCase()
        return msg.includes('cancel')
    },

    loadUserProfile() {
        const profile = wx.getStorageSync('userProfile')
        if (profile) {
            this.setData({
                user: {
                    gender: profile.gender || '男',
                    age: profile.age || 28,
                    height: profile.height || 175,
                    weight: profile.weight || 68
                }
            })
        }
    },

    // 打开工具
    openTool(e) {
        const { tool } = e.detail
        if (tool === 'BMI') this.setData({ showBMI: true })
        if (tool === 'BMR') this.setData({ showBMR: true })
        if (tool === 'HR') this.setData({ showHR: true })
        if (tool === 'WHR') this.setData({ showWHR: true })
        if (tool === 'BFR') this.setData({ showBFR: true })
        if (tool === 'RFM') this.setData({ showRFM: true })
    },

    closeTool() {
        this.setData({
            showBMI: false,
            showBMR: false,
            showHR: false,
            showWHR: false,
            showBFR: false,
            showRFM: false,
            showScanner: false
        })
    },

    // 接收组件更新Profile事件
    onUpdateProfile(e) {
        const newData = e.detail
        const currentUser = this.data.user
        this.setData({
            user: { ...currentUser, ...newData }
        })
        // 同时也更新本地存储 (防抖或直接更新)
        this.loadUserProfile()
    },

    goBackToMain() {
        this.setData({ activeTool: '' })
    },

    goBack() {
        wx.navigateBack()
    },

    // BMI计算
    calculateBMI() {
        const { height, weight } = this.data.user
        const heightM = height / 100
        const bmi = weight / (heightM * heightM)

        let status = '正常'
        let color = 'green'
        if (bmi < 18.5) { status = '偏瘦'; color = 'blue' }
        else if (bmi >= 24) { status = '超重'; color = 'orange' }
        if (bmi >= 28) { status = '肥胖'; color = 'red' }

        this.setData({
            bmi: bmi.toFixed(1),
            bmiStatus: status,
            bmiColor: color
        })
    },

    // BMR计算 (Mifflin-St Jeor公式)
    calculateBMR() {
        const { gender, weight, height, age } = this.data.user
        let bmr = (10 * weight) + (6.25 * height) - (5 * age)
        bmr += gender === '男' ? 5 : -161

        this.setData({ bmr: Math.round(bmr) })
    },

    // BFR计算 (Deurenberg公式)
    calculateBFR() {
        const { gender, weight, height, age } = this.data.user
        const heightM = height / 100
        const bmi = weight / (heightM * heightM)
        const sexValue = gender === '男' ? 1 : 0
        const bfr = (1.20 * bmi) + (0.23 * age) - (10.8 * sexValue) - 5.4

        this.setData({ bfr: bfr.toFixed(1) })
    },

    // RFM计算
    calculateRFM() {
        const { gender, height } = this.data.user
        const { waist } = this.data
        const sexCoeff = gender === '男' ? 0 : 1
        const rfm = 64 - (20 * (height / waist)) + (12 * sexCoeff)

        this.setData({ rfm: rfm.toFixed(1) })
    },

    adjustWaist(e) {
        const { delta } = e.currentTarget.dataset
        const newWaist = Math.max(50, Math.min(150, this.data.waist + parseInt(delta)))
        this.setData({ waist: newWaist }, () => this.calculateRFM())
    },

    // WHR计算
    calculateWHR() {
        const { gender } = this.data.user
        const { waistWhr, hip } = this.data
        const whr = waistWhr / hip
        const isHealthy = gender === '男' ? whr < 0.9 : whr < 0.85

        this.setData({
            whr: whr.toFixed(2),
            whrHealthy: isHealthy
        })
    },

    onWaistWhrChange(e) {
        this.setData({ waistWhr: e.detail.value }, () => this.calculateWHR())
    },

    onHipChange(e) {
        this.setData({ hip: e.detail.value }, () => this.calculateWHR())
    },

    // 心率计算
    calculateHeartRate() {
        const { age } = this.data.user
        const maxHr = 220 - age
        const burnMin = Math.round(maxHr * 0.6)
        const burnMax = Math.round(maxHr * 0.8)

        this.setData({ maxHr, burnMin, burnMax })
    },

    // 配料表识别
    openIngredientScanner() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['camera', 'album'],
            success: (res) => {
                const filePath = res && res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath
                if (!filePath) {
                    wx.showToast({ title: '未获取到图片，请重试', icon: 'none' })
                    return
                }

                // 仅在用户选图成功后展示分析弹层
                this.setData({ showScanner: true }, () => {
                    const scanner = this.selectComponent('#scanner')
                    if (scanner && typeof scanner.analyzeImage === 'function') {
                        scanner.analyzeImage(filePath)
                    } else {
                        this.setData({ showScanner: false })
                        wx.showToast({ title: '组件加载失败，请重试', icon: 'none' })
                    }
                })
            },
            fail: (err) => {
                if (this.isUserCancelError(err)) {
                    return
                }

                wx.showToast({ title: '无法访问相机或相册', icon: 'none' })
            }
        })
    },

    // ========== 底部导航栏 ==========

    switchToHome() {
        wx.redirectTo({
            url: '/pages/dashboard/index'
        })
    },

    goToStats() {
        wx.redirectTo({
            url: '/pages/stats/index'
        })
    },

    switchToCamera() {
        wx.redirectTo({
            url: '/pages/dashboard/index?action=camera'
        })
    },

    switchToProfile() {
        wx.redirectTo({
            url: '/pages/profile/index'
        })
    }
})
