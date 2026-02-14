/**
 * Profile页面 - 用户档案和设置
 */
Page({
    data: {
        user: null,
        bmi: '0.0',
        subPage: 'MAIN', // MAIN, PERSONAL, NUTRITION, HELP, DATA_MGMT, ABOUT
        appVersion: '1.0.0',
        usageDays: 0,
        totalMeals: 0,
        feedbackText: '',
        faqList: [
            { q: '如何修改我的体重目标？', a: '进入“个人设置” → “营养目标设置”，可以调整目标体重和每日热量目标。', open: false },
            { q: '食物识别不准确怎么办？', a: '拍照后可手动修改食物名称和营养数值；也可使用搜索功能输入准确的食物名称获取 AI 分析。', open: false },
            { q: '如何记录运动消耗？', a: '在首页点击底部拍照按钮 → 切换到“手动输入”标签，选择“运动”类别，记录运动类型和时长。', open: false }
        ],

        // 编辑状态
        editName: '',
        editAge: 0,
        editHeight: 0,
        editGender: '',
        editTargetWeight: 0,
        editGoal: '',
        editDiet: '',
        editCalories: 0,
        editAvatar: '', // Current avatar being edited
        defaultAvatars: [
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4', // Blue
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka&backgroundColor=c0aede', // Purple
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Milo&backgroundColor=ffdfbf',  // Yellow/Orange
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Liza&backgroundColor=d1d4f9',  // Periwinkle
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Brian&backgroundColor=c1f0db', // Mint
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Julia&backgroundColor=ffd5dc', // Pink
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&backgroundColor=ffb3b3',   // Salmon
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Chloe&backgroundColor=e0f7fa', // Light Cyan
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&backgroundColor=fff9c4',   // Light Yellow
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia&backgroundColor=fce4ec',   // Light Pink
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah&backgroundColor=e8f5e9',  // Light Green
            'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe&backgroundColor=ede7f6'    // Light Purple
        ]
    },

    onLoad() {
        this.loadUserProfile()
        // 初始化版本号
        const app = getApp()
        this.setData({
            appVersion: app.globalData.version || '1.0.0'
        })
    },

    onShow() {
        this.loadUserProfile()
    },

    loadUserProfile() {
        const profile = wx.getStorageSync('userProfile')
        if (profile) {
            const heightM = profile.height / 100
            const bmi = (profile.weight / (heightM * heightM)).toFixed(1)

            this.setData({
                user: profile,
                bmi: bmi,
                editName: profile.name,
                editAge: profile.age,
                editHeight: profile.height,
                editGender: profile.gender,
                editTargetWeight: profile.targetWeight,
                editGoal: profile.goal,
                editDiet: profile.dietPreference,
                editTargetWeight: profile.targetWeight,
                editGoal: profile.goal,
                editDiet: profile.dietPreference,
                editCalories: profile.targetCalories,
                editAvatar: profile.avatarUrl || ''
            })
        }
    },

    // 导航到子页面
    goToPersonal() {
        this.setData({ subPage: 'PERSONAL' })
    },

    goToNutrition() {
        this.setData({ subPage: 'NUTRITION' })
    },

    goToHelp() {
        this.setData({ subPage: 'HELP' })
    },

    goToDataMgmt() {
        this.setData({ subPage: 'DATA_MGMT' })
    },

    goToAbout() {
        this.setData({ subPage: 'ABOUT' })
        this.loadAboutStats()
    },

    async loadAboutStats() {
        try {
            // 计算使用天数
            const profile = wx.getStorageSync('userProfile')
            let usageDays = 1
            if (profile && profile.createdAt) {
                const created = new Date(profile.createdAt)
                const now = new Date()
                usageDays = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)))
            }

            // 获取累计记录餐数
            let totalMeals = 0
            try {
                const { call } = require('../../utils/cloudApi')
                const today = new Date()
                const year = today.getFullYear()
                const month = today.getMonth() + 1
                const res = await call('foodService', {
                    action: 'getMonthlyStats',
                    data: { year, month }
                })
                if (res.success && res.data) {
                    totalMeals = res.data.entries ? res.data.entries.length : 0
                }
            } catch (e) {
                console.warn('[About] 获取餐数失败:', e)
            }

            this.setData({ usageDays, totalMeals })
        } catch (error) {
            console.warn('[About] 加载统计失败:', error)
        }
    },

    goBack() {
        this.setData({ subPage: 'MAIN' })
    },

    // 个人资料编辑
    onNameInput(e) {
        this.setData({ editName: e.detail.value })
    },

    selectGender(e) {
        this.setData({ editGender: e.currentTarget.dataset.gender })
    },

    adjustAge(e) {
        const delta = parseInt(e.currentTarget.dataset.delta)
        const newAge = Math.max(1, Math.min(120, this.data.editAge + delta))
        this.setData({ editAge: newAge })
    },

    adjustHeight(e) {
        const delta = parseInt(e.currentTarget.dataset.delta)
        const newHeight = Math.max(100, Math.min(250, this.data.editHeight + delta))
        this.setData({ editHeight: newHeight })
    },

    // 头像处理逻辑
    onSelectDefaultAvatar(e) {
        const path = e.currentTarget.dataset.path
        this.setData({ editAvatar: path })
    },

    onChooseAvatar(e) {
        const { avatarUrl } = e.detail

        // 立即上传到云存储以获取永久链接
        wx.showLoading({ title: '上传中...' })

        const openid = this.data.user._openid || 'unknown'
        const timestamp = Date.now()
        // 获取文件扩展名 (通常 chooseAvatar 返回的是 .jpeg 或 .png 临时路径)
        const cloudPath = `avatars/${openid}_${timestamp}.jpg`

        const { initSharedCloud } = require('../../utils/cloudApi')
        initSharedCloud().then(cloud => {
            cloud.uploadFile({
                cloudPath: cloudPath,
                filePath: avatarUrl, // 临时文件路径
                success: res => {
                    console.log('[Avatar] Upload success:', res.fileID)
                    this.setData({ editAvatar: res.fileID })
                    wx.hideLoading()
                },
                fail: err => {
                    console.error('[Avatar] Upload failed:', err)
                    wx.hideLoading()
                    wx.showToast({ title: '上传失败', icon: 'none' })
                    // 降级：仅本地显示临时路径 (无法持久化到其他设备)
                    this.setData({ editAvatar: avatarUrl })
                }
            })
        }).catch(err => {
            console.error('[Avatar] Shared cloud init failed:', err)
            wx.hideLoading()
            wx.showToast({ title: '云环境异常', icon: 'none' })
        })
    },

    async savePersonal() {
        const { user, editName, editAge, editHeight, editGender, editAvatar } = this.data
        const updatedUser = {
            ...user,
            name: editName,
            age: editAge,
            height: editHeight,
            gender: editGender,
            avatarUrl: editAvatar || user.avatarUrl
        }

        // 重新计算BMR/TDEE
        this.recalculateStats(updatedUser)

        // 保存到本地
        wx.setStorageSync('userProfile', updatedUser)

        // 同步到云端
        const { call } = require('../../utils/cloudApi')
        try {
            await call('userService', {
                action: 'createOrUpdateProfile',
                data: updatedUser
            })
        } catch (error) {
            console.warn('[Profile] 云端同步失败:', error)
        }

        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ user: updatedUser, subPage: 'MAIN' })
        this.loadUserProfile()
    },

    // 营养目标编辑
    adjustTargetWeight(e) {
        const delta = parseFloat(e.currentTarget.dataset.delta)
        const newWeight = Math.max(30, Math.min(200, this.data.editTargetWeight + delta))
        this.setData({ editTargetWeight: parseFloat(newWeight.toFixed(1)) })
    },

    selectGoal(e) {
        this.setData({ editGoal: e.currentTarget.dataset.goal })
    },

    selectDiet(e) {
        this.setData({ editDiet: e.currentTarget.dataset.diet })
    },

    onCaloriesInput(e) {
        this.setData({ editCalories: parseInt(e.detail.value) || 0 })
    },

    async saveNutrition() {
        const { user, editTargetWeight, editGoal, editDiet, editCalories } = this.data

        // 根据饮食偏好计算营养比例
        let proteinRatio = 0.25, fatRatio = 0.30, carbsRatio = 0.45

        if (editDiet === 'lowCarb') {
            proteinRatio = 0.25; fatRatio = 0.40; carbsRatio = 0.35
        } else if (editDiet === 'highProtein') {
            proteinRatio = 0.35; fatRatio = 0.25; carbsRatio = 0.40
        } else if (editDiet === 'vegan') {
            proteinRatio = 0.15; fatRatio = 0.30; carbsRatio = 0.55
        }

        const updatedUser = {
            ...user,
            targetWeight: editTargetWeight,
            goal: editGoal,
            dietPreference: editDiet,
            targetCalories: editCalories,
            targetProtein: Math.round((editCalories * proteinRatio) / 4),
            targetFat: Math.round((editCalories * fatRatio) / 9),
            targetCarbs: Math.round((editCalories * carbsRatio) / 4)
        }

        // 保存到本地
        wx.setStorageSync('userProfile', updatedUser)

        // 同步到云端
        const { call } = require('../../utils/cloudApi')
        try {
            await call('userService', {
                action: 'createOrUpdateProfile',
                data: updatedUser
            })
        } catch (error) {
            console.warn('[Profile] 云端同步失败:', error)
        }

        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ user: updatedUser, subPage: 'MAIN' })
    },

    recalculateStats(userData) {
        const { gender, weight, height, age, activityLevel } = userData

        // BMR计算
        let bmr
        if (gender === '男') {
            bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
        } else {
            bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
        }

        // 活动系数
        const multipliers = {
            'sedentary': 1.2,
            'lightlyActive': 1.375,
            'moderatelyActive': 1.55,
            'veryActive': 1.725,
            'extraActive': 1.9
        }

        const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.375))

        userData.bmr = bmr
        userData.tdee = tdee
    },

    // ========== 帮助与反馈 ==========

    toggleFaq(e) {
        const index = e.currentTarget.dataset.index
        const key = `faqList[${index}].open`
        this.setData({ [key]: !this.data.faqList[index].open })
    },

    // ========== 数据管理 ==========

    async exportData() {
        wx.showLoading({ title: '导出中...' })
        try {
            const { call } = require('../../utils/cloudApi')
            const today = new Date()
            const year = today.getFullYear()
            const month = today.getMonth() + 1
            const monthStr = `${year}-${String(month).padStart(2, '0')}`

            const res = await call('foodService', {
                action: 'getEntries',
                data: { date: undefined }
            })

            if (res.success && res.data && res.data.length > 0) {
                // 筛选本月数据
                const monthEntries = res.data.filter(e => e.date && e.date.startsWith(monthStr))

                if (monthEntries.length === 0) {
                    wx.hideLoading()
                    wx.showToast({ title: '本月暂无数据', icon: 'none' })
                    return
                }

                // 生成文本摘要
                let text = `📊 SnapCal 饮食记录 - ${year}年${month}月\n\n`
                let totalCal = 0

                // 按日期分组
                const grouped = {}
                monthEntries.forEach(e => {
                    if (!grouped[e.date]) grouped[e.date] = []
                    grouped[e.date].push(e)
                    totalCal += e.calories || 0
                })

                Object.keys(grouped).sort().forEach(date => {
                    text += `📅 ${date}\n`
                    grouped[date].forEach(e => {
                        text += `  ${e.meal} - ${e.name}: ${e.calories}kcal\n`
                    })
                    text += '\n'
                })

                text += `\n总计: ${totalCal}kcal | 共${monthEntries.length}条记录`

                wx.setClipboardData({
                    data: text,
                    success: () => {
                        wx.hideLoading()
                        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
                    }
                })
            } else {
                wx.hideLoading()
                wx.showToast({ title: '暂无数据', icon: 'none' })
            }
        } catch (error) {
            wx.hideLoading()
            console.error('[Profile] 导出失败:', error)
            wx.showToast({ title: '导出失败', icon: 'none' })
        }
    },

    clearLocalCache() {
        wx.showModal({
            title: '确认清除',
            content: '将清除本地缓存数据（不影响云端数据）。清除后需要重新设置个人资料。',
            confirmText: '确认清除',
            confirmColor: '#EF4444',
            success: (res) => {
                if (res.confirm) {
                    wx.clearStorageSync()
                    wx.showToast({ title: '缓存已清除', icon: 'success' })
                    setTimeout(() => {
                        wx.redirectTo({ url: '/pages/onboarding/index' })
                    }, 1500)
                }
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

    goToHealth() {
        wx.redirectTo({
            url: '/pages/health/index'
        })
    }
})
