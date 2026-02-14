Page({
    data: {
        step: 0,
        progressPercent: 33,  // 进度百分比 (step+1)/3*100
        // 表单数据
        formData: {
            name: '',
            gender: '男',
            age: 28,
            height: 175,
            weight: 68.5,
            targetWeight: 65.0,
            activityLevel: '轻度活动 (每周锻炼1-3天)',
            goal: '减脂',
            dietPreference: '均衡饮食'
        },

        // 活动量选项
        activityLevels: [
            { value: '久坐 (很少或不运动)', label: '久坐', desc: '很少或不运动', icon: '🪑' },
            { value: '轻度活动 (每周锻炼1-3天)', label: '轻度活动', desc: '每周锻炼1-3天', icon: '🚶' },
            { value: '中度活动 (每周锻炼3-5天)', label: '中度活动', desc: '每周锻炼3-5天', icon: '🏋️' },
            { value: '高度活动 (每周锻炼6-7天)', label: '高度活动', desc: '每周锻炼6-7天', icon: '⚡' },
            { value: '极高活动 (每天多次锻炼)', label: '极高活动', desc: '每天多次锻炼', icon: '🏆' }
        ],

        // 目标选项
        goals: [
            { id: '减脂', title: '减脂', desc: '消耗体脂，塑造紧致身形', icon: '🔥' },
            { id: '保持', title: '保持', desc: '维持当前状态，保持健康', icon: '🛡️' },
            { id: '增肌', title: '增肌', desc: '增加肌肉质量，提升体能', icon: '💪' }
        ],

        // 饮食偏好选项
        dietPreferences: [
            { id: '全素', title: '全素', sub: '不含动物性食品' },
            { id: '低碳水', title: '低碳水', sub: '控糖，高燃脂' },
            { id: '高蛋白', title: '高蛋白', sub: '增肌必备选择' },
            { id: '均衡饮食', title: '均衡饮食', sub: '营养比例均衡' }
        ],

        // 计算结果
        stats: {
            bmr: 0,
            tdee: 0,
            targetCalories: 0,
            targetProtein: 0,
            targetFat: 0,
            targetCarbs: 0
        }
    },

    onLoad() {
        console.log('[Onboarding] 页面加载')
        this.calculateResults()
    },

    /**
     * 处理输入变化
     */
    handleInputChange(field, value) {
        // 强制转换数值字段，防止字符串污染
        const numericFields = ['age', 'height', 'weight', 'targetWeight']
        let finalValue = value

        if (numericFields.includes(field)) {
            finalValue = Number(value)
            // 如果转换失败（NaN），回退为0或保持原值
            if (isNaN(finalValue)) {
                console.warn(`[Onboarding] 字段 ${field} 收到非数值:`, value)
                finalValue = 0
            }
        }

        this.setData({
            [`formData.${field}`]: finalValue
        }, () => {
            // 重新计算结果
            this.calculateResults()
        })
    },

    /**
     * 昵称输入
     */
    onNameInput(e) {
        this.handleInputChange('name', e.detail.value)
    },

    /**
     * 性别选择
     */
    selectGender(e) {
        const { gender } = e.currentTarget.dataset
        this.handleInputChange('gender', gender)
    },

    /**
     * 年龄输入
     */
    onAgeInput(e) {
        this.handleInputChange('age', Number(e.detail.value))
    },

    /**
     * 身高滑动
     */
    onHeightChanging(e) {
        const nextHeight = Number(e.detail.value)
        if (!Number.isFinite(nextHeight)) return
        this.setData({
            'formData.height': nextHeight
        })
    },

    onHeightChange(e) {
        this.handleInputChange('height', e.detail.value)
    },

    /**
     * 体重调整
     */
    adjustWeight(e) {
        const { amount } = e.currentTarget.dataset
        // 显式转换为数字，防止字符串拼接错误
        const currentWeight = Number(this.data.formData.weight) || 0
        const amountNum = Number(amount)
        const newWeight = Number((currentWeight + amountNum).toFixed(1))

        this.handleInputChange('weight', newWeight)
    },

    /**
     * 活动量选择
     */
    selectActivity(e) {
        const { level } = e.currentTarget.dataset
        this.handleInputChange('activityLevel', level)
    },

    /**
     * 目标选择
     */
    selectGoal(e) {
        const { goal } = e.currentTarget.dataset
        this.handleInputChange('goal', goal)
    },

    /**
     * 目标体重调整
     */
    adjustTargetWeight(e) {
        const { amount } = e.currentTarget.dataset
        // 显式转换为数字，防止字符串拼接错误
        const currentTargetWeight = Number(this.data.formData.targetWeight) || 0
        const amountNum = Number(amount)
        const newWeight = Number((currentTargetWeight + amountNum).toFixed(1))

        this.handleInputChange('targetWeight', newWeight)
    },

    /**
     * 目标体重滑动
     */
    onTargetWeightChanging(e) {
        const nextWeight = Number(e.detail.value)
        if (!Number.isFinite(nextWeight)) return
        this.setData({
            'formData.targetWeight': nextWeight
        })
    },

    onTargetWeightChange(e) {
        this.handleInputChange('targetWeight', Number(e.detail.value))
    },

    /**
     * 饮食偏好选择
     */
    selectDiet(e) {
        const { diet } = e.currentTarget.dataset
        this.handleInputChange('dietPreference', diet)
    },

    /**
     * 计算BMR、TDEE和营养目标
     */
    calculateResults() {
        const { gender, weight, height, age, activityLevel, goal, dietPreference } = this.data.formData

        // Mifflin-St Jeor公式计算BMR
        let bmr = (10 * weight) + (6.25 * height) - (5 * age)
        bmr += gender === '男' ? 5 : -161

        // 根据活动量计算TDEE
        let multiplier = 1.2
        if (activityLevel.includes('久坐')) multiplier = 1.2
        else if (activityLevel.includes('轻度')) multiplier = 1.375
        else if (activityLevel.includes('中度')) multiplier = 1.55
        else if (activityLevel.includes('高度')) multiplier = 1.725
        else if (activityLevel.includes('极高')) multiplier = 1.9

        const tdee = Math.round(bmr * multiplier)

        // 根据目标调整卡路里
        let targetCalories = tdee
        if (goal === '减脂') targetCalories -= 500
        if (goal === '增肌') targetCalories += 300

        // 根据饮食偏好计算营养比例
        let proteinRatio = 0.3
        let fatRatio = 0.3
        let carbsRatio = 0.4

        if (dietPreference === '低碳水') {
            proteinRatio = 0.4
            fatRatio = 0.4
            carbsRatio = 0.2
        } else if (dietPreference === '高蛋白') {
            proteinRatio = 0.4
            fatRatio = 0.3
            carbsRatio = 0.3
        } else if (dietPreference === '全素') {
            proteinRatio = 0.25
            fatRatio = 0.25
            carbsRatio = 0.5
        }

        const targetProtein = Math.round((targetCalories * proteinRatio) / 4)
        const targetFat = Math.round((targetCalories * fatRatio) / 9)
        const targetCarbs = Math.round((targetCalories * carbsRatio) / 4)

        this.setData({
            stats: {
                bmr: Math.round(bmr),
                tdee,
                targetCalories,
                targetProtein,
                targetFat,
                targetCarbs
            }
        })
    },

    /**
     * 上一步
     */
    prevStep() {
        if (this.data.step > 0) {
            const newStep = this.data.step - 1
            this.setData({
                step: newStep,
                progressPercent: Math.round((newStep + 1) / 3 * 100)
            })
        }
    },

    /**
     * 下一步
     */
    nextStep() {
        // 验证第一步
        if (this.data.step === 0 && !this.data.formData.name) {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none'
            })
            return
        }

        if (this.data.step < 2) {
            const newStep = this.data.step + 1
            this.setData({
                step: newStep,
                progressPercent: Math.round((newStep + 1) / 3 * 100)
            })
        }
    },

    /**
     * 完成设置
     */
    async handleFinish() {
        console.log('[Onboarding] 完成设置', this.data.formData, this.data.stats)

        const { call } = require('../../utils/cloudApi')

        // 构建用户档案
        const userProfile = {
            ...this.data.formData,
            ...this.data.stats,
            avatarUrl: '',
            createdAt: new Date().toISOString()
        }

        // 保存到本地存储
        wx.setStorageSync('userProfile', userProfile)

        // 同步到云端
        try {
            wx.showLoading({ title: '保存中...' })

            const result = await call('userService', {
                action: 'createOrUpdateProfile',
                data: userProfile
            })

            wx.hideLoading()

            if (result.success) {
                console.log('[Onboarding] 云端同步成功')
            } else {
                console.warn('[Onboarding] 云端同步失败:', result.error)
            }
        } catch (error) {
            wx.hideLoading()
            console.error('[Onboarding] 云端同步异常:', error)
        }

        wx.showToast({
            title: '设置完成！',
            icon: 'success',
            duration: 2000
        })

        // 跳转到Dashboard
        setTimeout(() => {
            wx.redirectTo({
                url: '/pages/dashboard/index'
            })
        }, 2000)
    }
})
