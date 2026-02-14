import { call, initSharedCloud } from '../../utils/cloudApi'

Page({
    data: {
        // 用户信息
        user: {
            name: '用户',
            avatarUrl: '',
            targetCalories: 2000,
            targetProtein: 150,
            targetCarbs: 250,
            targetFat: 65
        },

        // 今日日期
        today: {
            month: 0,
            date: 0,
            dayName: '',
            dateStr: '' // YYYY-MM-DD格式
        },

        // 今日统计
        totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        },

        // 运动消耗
        totalBurned: 0,

        // 计算后的数据
        remainingCalories: 0,
        dailyTarget: 0,
        percentConsumed: 0,

        // 营养进度百分比
        proteinPercent: 0,
        carbsPercent: 0,
        fatPercent: 0,

        // 餐次记录
        mealSections: [
            {
                type: '早餐',
                icon: '☀️',
                iconBg: 'bg-orange-50',
                iconColor: 'text-orange-500',
                buttonBg: 'bg-orange-50',
                buttonColor: 'text-orange-600',
                calories: 0,
                logs: []
            },
            {
                type: '午餐',
                icon: '🌤️',
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-500',
                buttonBg: 'bg-blue-50',
                buttonColor: 'text-blue-600',
                calories: 0,
                logs: []
            },
            {
                type: '晚餐',
                icon: '🌙',
                iconBg: 'bg-indigo-50',
                iconColor: 'text-indigo-500',
                buttonBg: 'bg-indigo-50',
                buttonColor: 'text-indigo-600',
                calories: 0,
                logs: []
            },
            {
                type: '加餐',
                icon: '🍪',
                iconBg: 'bg-pink-50',
                iconColor: 'text-pink-500',
                buttonBg: 'bg-pink-50',
                buttonColor: 'text-pink-600',
                calories: 0,
                logs: []
            }
        ],

        // 运动记录
        exercises: [],

        // 底部导航当前选中
        currentTab: 'home',

        // 加载状态
        loading: true,

        // ========== 自定义弹窗状态 ==========
        showQuickLogModal: false,
        showAiResultModal: false,
        showExerciseModal: false,
        tempExercise: {
            name: '',
            duration: 30,
            calories: ''
        },
        currentMealType: '',
        tempFoodName: '',

        // AI识别结果暂存
        aiResult: {
            name: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            imageUrl: ''
        },

        // 临时编辑数据
        tempNutrients: {
            calories: '',
            protein: '',
            carbs: '',
            fat: ''
        },

        // --- 新版统一弹窗状态 ---
        showLogModal: false,
        logTab: 'manual', // 'camera', 'search', 'manual', 'list'
        selectedMealType: '早餐',
        mealTypes: ['早餐', '午餐', '晚餐', '加餐'],

        // 食物列表 (多卡片模式)
        foodList: [],

        // 搜索相关
        searchQuery: '',

        // 运动相关数据
        showExerciseModal: false,
        tempExercise: {
            name: '',
            duration: 30,
            calories: 0,
            typeIndex: 0 // 默认选中第一个
        },
        // 预置运动类型 (MET值参考)
        exerciseTypes: [
            { name: '散步', icon: '🚶', met: 3.5 },
            { name: '跑步', icon: '🏃', met: 8.0 },
            { name: '骑行', icon: '🚴', met: 7.5 },
            { name: '游泳', icon: '🏊', met: 7.0 },
            { name: '力量', icon: '🏋️', met: 5.0 },
            { name: 'HIIT', icon: '🔥', met: 8.0 },
            { name: '瑜伽', icon: '🧘', met: 2.5 },
            { name: '普拉提', icon: '🤸', met: 3.0 },
            { name: '登山', icon: '⛰️', met: 7.0 },
            { name: '跳绳', icon: '〰️', met: 10.0 },
            { name: '篮球', icon: '🏀', met: 6.5 },
            { name: '足球', icon: '⚽', met: 7.0 },
            { name: '羽毛球', icon: '🏸', met: 5.5 },
            { name: '网球', icon: '🎾', met: 7.0 },
            { name: '乒乓球', icon: '🏓', met: 4.0 },
            { name: '椭圆机', icon: '🔄', met: 5.0 }
        ]
    },

    onLoad(options) {
        console.log('[Dashboard] 页面加载', options)
        this.initializeData()
        this.loadUserProfile()

        // 处理跳转行为
        if (options && options.action === 'camera') {
            // 延迟一会打开，等待页面渲染
            setTimeout(() => {
                this.switchToCamera()
            }, 500)
        }
    },

    onShow() {
        // 每次返回首页时刷新用户档案（含头像）和当日数据
        this.loadUserProfile()
    },

    /**
     * 初始化日期数据
     */
    initializeData() {
        const today = new Date()
        const days = ['日', '一', '二', '三', '四', '五', '六']
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        this.setData({
            'today.month': today.getMonth() + 1,
            'today.date': today.getDate(),
            'today.dayName': `星期${days[today.getDay()]}`,
            'today.dateStr': dateStr
        })
    },

    /**
     * 日期选择回调
     */
    onDateChange(e) {
        const dateStr = e.detail.value
        if (!dateStr) return

        const date = new Date(dateStr)
        const days = ['日', '一', '二', '三', '四', '五', '六']

        // Check if selected date is today
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        const dayLabel = isToday ? '今天' : `星期${days[date.getDay()]}`

        this.setData({
            'today.month': date.getMonth() + 1,
            'today.date': date.getDate(),
            'today.dayName': dayLabel,
            'today.dateStr': dateStr
        }, () => {
            // Reload data after state update
            this.loadDailyData()
        })
    },

    /**
     * 加载用户档案
     */
    async loadUserProfile() {
        const profile = wx.getStorageSync('userProfile')
        if (profile) {
            const avatarDisplayUrl = await this.toDisplayAvatarUrl(profile.avatarUrl || '')
            this.setData({
                user: {
                    name: profile.name || '用户',
                    avatarUrl: avatarDisplayUrl || '',
                    targetCalories: profile.targetCalories || 2000,
                    targetProtein: profile.targetProtein || 150,
                    targetCarbs: profile.targetCarbs || 250,
                    targetFat: profile.targetFat || 65,
                    weight: profile.weight || 65
                }
            })
        }
        this.loadDailyData()
    },

    async toDisplayAvatarUrl(value) {
        if (!value || typeof value !== 'string') return ''
        if (value.startsWith('https://') || value.startsWith('http://') || value.startsWith('wxfile://') || value.startsWith('data:')) {
            return value
        }
        if (!value.startsWith('cloud://')) {
            return value
        }

        try {
            const cloud = await initSharedCloud()
            const result = await cloud.getTempFileURL({ fileList: [value] })
            const item = result && result.fileList && result.fileList[0]
            return (item && item.tempFileURL) || ''
        } catch (error) {
            console.warn('[Dashboard] cloud avatar url resolve failed:', error)
            return ''
        }
    },

    /**
     * 加载今日数据
     */
    async loadDailyData() {
        const { dateStr } = this.data.today
        if (!dateStr) return

        this.setData({ loading: true })

        try {
            // 并行加载饮食和运动数据
            const [foodResult, exerciseResult] = await Promise.all([
                call('foodService', { action: 'getDailyStats', data: { date: dateStr } }),
                call('exerciseService', { action: 'getDailyStats', data: { date: dateStr } })
            ])

            if (foodResult.success) {
                const stats = foodResult.data

                // 更新餐次数据
                const mealSections = this.data.mealSections.map(section => {
                    const meals = stats.meals[section.type] || []
                    const calories = meals.reduce((sum, m) => sum + (m.calories || 0), 0)
                    return {
                        ...section,
                        logs: meals,
                        calories
                    }
                })

                this.setData({
                    totals: {
                        calories: stats.totalCalories,
                        protein: stats.totalProtein,
                        carbs: stats.totalCarbs,
                        fat: stats.totalFat
                    },
                    mealSections
                })
            }

            if (exerciseResult.success) {
                // 回填图标 (兼容历史数据)
                const exercises = exerciseResult.data.entries.map(e => {
                    if (!e.icon) {
                        const match = this.data.exerciseTypes.find(t => t.name === (e.type || e.name))
                        if (match) e.icon = match.icon
                    }
                    return e
                })

                this.setData({
                    totalBurned: exerciseResult.data.totalCalories,
                    exercises: exercises
                })
            }
        } catch (error) {
            console.error('[Dashboard] 加载数据失败:', error)
        } finally {
            this.setData({ loading: false })
            this.calculateTotals()
        }
    },

    /**
     * 计算总计和进度
     */
    calculateTotals() {
        const { user, totals, totalBurned } = this.data

        // 计算剩余卡路里 = 目标 + 运动消耗 - 已摄入
        const dailyTarget = user.targetCalories + totalBurned
        const remainingCalories = Math.max(0, dailyTarget - totals.calories)

        // 计算消耗百分比
        const percentConsumed = Math.min(100, (totals.calories / dailyTarget) * 100)

        // 计算营养进度
        const proteinPercent = Math.min(100, (totals.protein / user.targetProtein) * 100)
        const carbsPercent = Math.min(100, (totals.carbs / user.targetCarbs) * 100)
        const fatPercent = Math.min(100, (totals.fat / user.targetFat) * 100)

        this.setData({
            remainingCalories: Math.round(remainingCalories),
            dailyTarget,
            percentConsumed: Math.round(percentConsumed),
            proteinPercent: Math.round(proteinPercent),
            carbsPercent: Math.round(carbsPercent),
            fatPercent: Math.round(fatPercent)
        })
    },

    /**
     * 处理餐次记录 - AI识别拍照
     */
    handleLogFoodPhoto(e) {
        const { type } = e.currentTarget.dataset
        console.log('[Dashboard] 打开拍照记录', type)
        // 打开统一弹窗，Tab=camera
        this.openLogModal(type, 'camera')
    },



    /**
     * 显示食物识别结果 (使用自定义Modal)
     */
    showFoodResult(result, mealType, imageUrl) {
        // 设置AI结果并初始化编辑数据
        this.setData({
            aiResult: {
                ...result,
                imageUrl: imageUrl || ''
            },
            // 将识别结果预填入编辑框
            tempNutrients: {
                calories: result.calories,
                protein: result.protein,
                carbs: result.carbs,
                fat: result.fat
            },
            // 同时预填名称
            tempFoodName: result.foodName || result.name || '',
            currentMealType: mealType,
            showAiResultModal: true
        })
    },

    // ========== AI结果Modal事件 ==========

    closeAiResultModal() {
        this.setData({ showAiResultModal: false })
    },

    async confirmAiResult() {
        const { selectedMealType, aiResult, tempFoodName, tempNutrients } = this.data

        // 使用编辑后的数据
        await this.addFoodEntry(selectedMealType, {
            name: tempFoodName || aiResult.name, // 优先使用编辑后的名称
            calories: Number(tempNutrients.calories) || 0,
            protein: Number(tempNutrients.protein) || 0,
            carbs: Number(tempNutrients.carbs) || 0,
            fat: Number(tempNutrients.fat) || 0,
            imageUrl: aiResult.imageUrl
        })

        this.closeAiResultModal()
    },

    /**
     * 添加饮食记录
     */
    async addFoodEntry(mealType, foodData) {
        const { dateStr } = this.data.today

        try {
            wx.showLoading({ title: '保存中...' })
            const result = await call('foodService', {
                action: 'addEntry',
                data: {
                    date: dateStr,
                    meal: mealType,
                    ...foodData
                }
            })
            wx.hideLoading()

            if (result.success) {
                wx.showToast({ title: '添加成功', icon: 'success' })
                this.loadDailyData()
            }
        } catch (error) {
            wx.hideLoading()
            console.error('[Dashboard] 添加记录失败:', error)
            wx.showToast({ title: '添加失败', icon: 'none' })
        }
    },

    /**
     * 处理餐次记录 - 快捷记录 (使用自定义Modal)
     */
    handleLogFoodSearch(e) {
        const { type } = e.currentTarget.dataset
        console.log('[Dashboard] 打开快捷记录', type)
        // 打开统一弹窗，Tab=manual (因UI图手输页即为详细录入页，这里对应"快捷记录")
        // 如果想默认进搜索页，可改为 'search'
        this.openLogModal(type, 'manual')
    },



    // ========== 快捷记录Modal事件 ==========

    onTempFoodNameInput(e) {
        this.setData({ tempFoodName: e.detail.value })
    },

    // 通用营养素输入处理
    onNutrientInput(e) {
        const field = e.currentTarget.dataset.field
        const value = e.detail.value
        this.setData({
            [`tempNutrients.${field}`]: value
        })
    },

    closeQuickLogModal() {
        this.setData({ showQuickLogModal: false })
    },

    async confirmQuickLog() {
        // ... deleted ...
    },

    // ========== 统一饮食记录弹窗逻辑 ==========

    /**
     * 打开记录弹窗
     * @param {string} mealType - 餐次类型
     * @param {string} tab - 默认打开的标签页 'camera' | 'search' | 'manual'
     */
    openLogModal(mealType, tab = 'manual') {
        const resetNutrients = {
            calories: '',
            protein: '',
            carbs: '',
            fat: ''
        };

        this.setData({
            showLogModal: true,
            selectedMealType: mealType || '早餐',
            logTab: tab,
            tempFoodName: '',
            tempNutrients: resetNutrients,
            aiResult: { imageUrl: '' } // 重置图片
        })
    },

    closeLogModal() {
        this.setData({ showLogModal: false })
    },

    // 切换标签页
    switchLogTab(e) {
        const tab = e.currentTarget.dataset.tab
        this.setData({ logTab: tab })
    },

    // 搜索输入处理
    onSearchInput(e) {
        this.setData({ searchQuery: e.detail.value })
    },

    // 执行食物搜索 (AI 分析)
    async handleSearchFood() {
        const { searchQuery } = this.data
        if (!searchQuery.trim()) return

        this.setData({ analyzing: true, analyzingText: '正在分析食物营养...' })

        try {
            const result = await call('aiService', {
                action: 'analyzeNutrition',
                data: { foodName: searchQuery }
            })

            this.setData({ analyzing: false })

            if (result.success && result.data) {
                // 将搜索结果预填入编辑区域
                this.setData({
                    tempFoodName: result.data.name || searchQuery,
                    tempNutrients: {
                        calories: result.data.calories || 0,
                        protein: result.data.protein || 0,
                        carbs: result.data.carbs || 0,
                        fat: result.data.fat || 0
                    },
                    searchQuery: '',
                    logTab: 'manual' // 切换到手输模式以便编辑
                })
                wx.showToast({ title: '已获取营养信息', icon: 'success' })
            } else {
                wx.showToast({ title: '未找到该食物', icon: 'none' })
            }
        } catch (error) {
            this.setData({ analyzing: false })
            console.error('[Dashboard] 搜索食物失败:', error)
            // 失败时使用默认值
            this.setData({
                tempFoodName: searchQuery,
                tempNutrients: {
                    calories: 200,
                    protein: 10,
                    carbs: 25,
                    fat: 8
                },
                searchQuery: '',
                logTab: 'manual'
            })
            wx.showToast({ title: '使用默认估算值', icon: 'none' })
        }
    },

    // 切换餐次
    selectLogMealType(e) {
        const type = e.currentTarget.dataset.type
        this.setData({ selectedMealType: type })
    },

    // 弹窗内的通用输入处理
    onLogInput(e) {
        const field = e.currentTarget.dataset.field
        const value = e.detail.value

        if (field === 'name') {
            this.setData({ tempFoodName: value })
        } else {
            this.setData({
                [`tempNutrients.${field}`]: value
            })
        }
    },

    /**
     * 列表模式：更新单项数据
     */
    onFoodItemChange(e) {
        const { index, field } = e.currentTarget.dataset
        const value = e.detail.value

        // 构建更新路径 'foodList[0].name'
        const key = `foodList[${index}].${field}`
        this.setData({
            [key]: value
        })
    },

    /**
     * 列表模式：删除单项
     */
    removeFoodItem(e) {
        const index = e.currentTarget.dataset.index
        const list = this.data.foodList
        list.splice(index, 1)
        this.setData({ foodList: list })

        // 如果删完了，可能想切回手输或关闭？暂停留空
    },

    /**
     *列表模式：清空列表
     */
    clearFoodList() {
        this.setData({ foodList: [] })
    },

    /**
     * 确认添加 (统一入口 - 支持多条)
     */
    async confirmLog() {
        // 如果是列表模式，批量提交
        if (this.data.logTab === 'list' && this.data.foodList.length > 0) {
            this.confirmBatchLog()
            return
        }

        // --- 旧逻辑：单条录入 ---
        const { tempFoodName, selectedMealType, tempNutrients, aiResult } = this.data

        // 简单校验
        // 如果是手动输入且没有名字，给个默认名
        const name = tempFoodName.trim() || '未命名食物'

        const foodData = {
            name: name,
            calories: Number(tempNutrients.calories) || 0,
            protein: Number(tempNutrients.protein) || 0,
            carbs: Number(tempNutrients.carbs) || 0,
            fat: Number(tempNutrients.fat) || 0,
            imageUrl: aiResult.imageUrl || ''
        }

        await this.addFoodEntry(selectedMealType, foodData)
        this.closeLogModal()
    },

    /**
     * 批量提交 (列表模式)
     */
    async confirmBatchLog() {
        const { foodList, selectedMealType } = this.data
        if (foodList.length === 0) return

        wx.showLoading({ title: '保存中...' })

        try {
            // 串行或并行提交均可，这里用循环调用 addFoodEntry (内部有 loading 需优化体验)
            // 为了体验，我们临时禁用 addFoodEntry 的 loading，或者重写一个 batchAdd
            // 简单循环:
            for (const item of foodList) {
                const foodData = {
                    name: item.name,
                    calories: Number(item.calories) || 0,
                    protein: Number(item.protein) || 0,
                    carbs: Number(item.carbs) || 0,
                    fat: Number(item.fat) || 0,
                    imageUrl: item.imageUrl || ''
                }
                // 注意：这里调用的是底层 addEntry，不带UI loading更好
                await this._addEntrySilent(selectedMealType, foodData)
            }

            wx.hideLoading()
            wx.showToast({ title: `已添加 ${foodList.length} 项`, icon: 'success' })

            // 清空并关闭
            this.setData({ foodList: [] })
            this.closeLogModal()
            this.loadDailyData()

        } catch (error) {
            wx.hideLoading()
            console.error('[Dashboard] 批量添加失败', error)
            wx.showToast({ title: '部分添加失败', icon: 'none' })
        }
    },

    /**
     * 内部无UI版保存，专供批量调用
     */
    async _addEntrySilent(mealType, foodData) {
        const { dateStr } = this.data.today
        return await call('foodService', {
            action: 'addEntry',
            data: {
                date: dateStr,
                meal: mealType,
                ...foodData
            }
        })
    },

    /**
     * 弹窗内触发拍照流程
     */
    /**
     * 弹窗内触发拍照流程
     */
    handleCameraAction() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['camera', 'album'],
            success: async (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath

                // 1. 启动沉浸式扫描动画
                this.setData({
                    analyzing: true,
                    scanImageUrl: tempFilePath,
                    analyzingText: '正在连接神经网络...'
                })

                // 2. 模拟扫描阶段文案变化 (增强体验)
                setTimeout(() => {
                    this.setData({ analyzingText: '正在分析食物成分...' })
                }, 1500)

                try {
                    const cloud = await initSharedCloud()
                    const uploadResult = await cloud.uploadFile({
                        cloudPath: `food_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                        filePath: tempFilePath
                    })

                    // 获取临时链接
                    const urlResult = await cloud.getTempFileURL({
                        fileList: [uploadResult.fileID]
                    })
                    const httpsUrl = urlResult.fileList[0].tempFileURL

                    // 3. 调用AI识别
                    const aiResult = await call('aiService', {
                        action: 'analyzeFood',
                        data: { imageUrl: httpsUrl }
                    })

                    // 4. 智能餐次预测
                    const hour = new Date().getHours()
                    let predictedMeal = '加餐'
                    if (hour >= 5 && hour < 10) predictedMeal = '早餐'
                    else if (hour >= 10 && hour < 16) predictedMeal = '午餐'
                    else if (hour >= 16 && hour < 24) predictedMeal = '晚餐'

                    // 稍微延迟关闭动画，让用户看清"分析完成"
                    // 但为了流畅，直接进入结果页
                    this.setData({ analyzing: false })

                    if (aiResult.success && aiResult.data) {
                        const result = aiResult.data
                        // 5. 不直接入库，而是打开结果确认卡片
                        this.showFoodResult(result, predictedMeal, httpsUrl)
                    } else {
                        wx.showToast({ title: '识别失败，请重试', icon: 'none' })
                    }
                } catch (error) {
                    this.setData({ analyzing: false })
                    console.error('[Dashboard] AI识别失败:', error)
                    wx.showToast({ title: '识别失败', icon: 'none' })
                }
            },
            fail: (err) => {
                // 用户取消选择，不做处理
                console.log('取消选择', err)
            }
        })
    },

    /**
     * 打开运动记录弹窗
     */
    handleLogExercise() {
        this.setData({
            showExerciseModal: true,
            tempExercise: {
                name: '',
                duration: 30,
                calories: ''
            }
        })
    },

    /**
     * 关闭运动弹窗
     */
    closeExerciseModal() {
        this.setData({
            showExerciseModal: false
        })
    },

    /**
     * 选择运动类型
     */
    selectExerciseType(e) {
        const index = e.currentTarget.dataset.index
        const type = this.data.exerciseTypes[index]

        this.setData({
            'tempExercise.typeIndex': index,
            'tempExercise.name': type.name
        })
        this.calculateExerciseCalories(undefined, index)
    },

    /**
     * 调整时长 (Slider)
     */
    onDurationChange(e) {
        console.log('[Dashboard] onDurationChange triggered', e.detail.value)
        const duration = parseInt(e.detail.value, 10)
        this.setData({
            'tempExercise.duration': duration
        })
        this.calculateExerciseCalories(duration, undefined)
    },

    /**
     * 手动输入热量 (允许修正)
     */
    onExerciseCaloriesInput(e) {
        const calories = parseInt(e.detail.value) || 0
        this.setData({
            'tempExercise.calories': calories
        })
    },

    /**
     * 计算热量
     * 公式: Calories = MET * Weight(kg) * Time(hours)
     */
    calculateExerciseCalories(currentDuration, currentTypeIndex) {
        const duration = currentDuration !== undefined ? currentDuration : this.data.tempExercise.duration
        const typeIndex = currentTypeIndex !== undefined ? currentTypeIndex : this.data.tempExercise.typeIndex

        const weight = this.data.user.weight || 65
        const typeObj = this.data.exerciseTypes[typeIndex]
        const met = (typeObj && typeObj.met) ? typeObj.met : 1

        // 分钟转小时
        const hours = duration / 60
        const calories = Math.round(met * weight * hours)

        this.setData({
            'tempExercise.calories': calories
        })
    },

    /**
     * 确认添加运动
     */
    async confirmExercise() {
        const { name, duration, calories } = this.data.tempExercise

        if (!name) {
            wx.showToast({ title: '请输入运动名称', icon: 'none' })
            return
        }

        wx.showLoading({ title: '保存中...' })

        try {
            const { dateStr } = this.data.today
            const result = await call('exerciseService', {
                action: 'addEntry',
                data: {
                    date: dateStr,
                    name,
                    type: name,
                    icon: this.data.exerciseTypes[this.data.tempExercise.typeIndex].icon,
                    duration: parseInt(duration) || 0,
                    calories: parseInt(calories) || 0
                }
            })

            wx.hideLoading()

            if (result.success) {
                wx.showToast({ title: '添加成功', icon: 'success' })
                this.closeExerciseModal()
                this.loadDailyData()
            }
        } catch (error) {
            wx.hideLoading()
            console.error('[Dashboard] 添加运动失败:', error)
            wx.showToast({ title: '添加失败', icon: 'none' })
        }
    },

    /**
     * 打开日历
     */
    openCalendar() {
        console.log('[Dashboard] 打开日历')
        wx.showToast({ title: '功能开发中', icon: 'none' })
    },

    /**
     * 跳转到统计页面
     */
    viewNutritionDetails() {
        console.log('[Dashboard] 跳转到统计页面')
        wx.redirectTo({
            url: '/pages/stats/index'
        })
    },

    /**
     * 跳转到健康页面
     */
    goToHealth() {
        console.log('[Dashboard] 跳转到健康页面')
        wx.redirectTo({
            url: '/pages/health/index'
        })
    },

    // ========== 底部导航栏 ==========

    /**
     * 切换到首页
     */
    switchToHome() {
        this.setData({ currentTab: 'home' })
        // 已在首页，刷新数据
        this.loadDailyData()
    },

    /**
     * 切换到AI拍照 (Pro Max Flow)
     */
    switchToCamera() {
        wx.showActionSheet({
            itemList: ['📷 拍照识别', '🖼️ 相册上传'],
            success: (res) => {
                const index = res.tapIndex
                if (index === 0) {
                    this.startAiScanFlow('camera')
                } else if (index === 1) {
                    this.startAiScanFlow('album')
                }
            }
        })
    },

    /**
     * 启动 AI 扫描流程
     */
    startAiScanFlow(sourceType) {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: [sourceType],
            success: async (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath

                // 1. 启动扫描全屏动画
                this.setData({
                    analyzing: true,
                    scanImageUrl: tempFilePath, // 用于背景模糊
                    analyzingText: '正在连接大脑...'
                })

                // 模拟文案跳变，缓解焦虑
                const txtTimer = setInterval(() => {
                    const texts = ['正在分析图像...', '识别食物成分...', '估算热量数据...', '生成营养建议...']
                    const randomTxt = texts[Math.floor(Math.random() * texts.length)]
                    this.setData({ analyzingText: randomTxt })
                }, 1500)

                try {
                    const cloud = await initSharedCloud()

                    // 2. 上传图片
                    const uploadResult = await cloud.uploadFile({
                        cloudPath: `food_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                        filePath: tempFilePath
                    })

                    // 获取临时链接
                    const urlResult = await cloud.getTempFileURL({
                        fileList: [uploadResult.fileID]
                    })
                    const httpsUrl = urlResult.fileList[0].tempFileURL

                    // 3. 调用 AI 识别
                    const aiResult = await call('aiService', {
                        action: 'analyzeFood',
                        data: { imageUrl: httpsUrl }
                    })

                    clearInterval(txtTimer)
                    this.setData({ analyzing: false }) // 关闭扫描层

                    if (aiResult.success && aiResult.data) {
                        const result = aiResult.data

                        // 4. 弹出 Pro Max 结果卡片
                        // 自动判断餐次
                        const hour = new Date().getHours()
                        let autoMeal = '早餐'
                        if (hour >= 11 && hour < 14) autoMeal = '午餐'
                        else if (hour >= 17 && hour < 21) autoMeal = '晚餐'
                        else if (hour >= 14 || hour >= 21) autoMeal = '加餐'

                        this.setData({
                            showAiResultModal: true,
                            selectedMealType: autoMeal, // 自动选中
                            aiResult: {
                                ...result,
                                imageUrl: httpsUrl
                            },
                            // 预填编辑数据
                            tempFoodName: result.foodName || result.name || '未命名食物',
                            tempNutrients: {
                                calories: result.calories || 0,
                                protein: result.protein || 0,
                                carbs: result.carbs || 0,
                                fat: result.fat || 0
                            }
                        })
                    } else {
                        wx.showToast({ title: '识别失败', icon: 'none' })
                    }

                } catch (error) {
                    clearInterval(txtTimer)
                    this.setData({ analyzing: false })
                    console.error('[Dashboard] AI流程异常:', error)
                    wx.showToast({ title: '识别出错', icon: 'none' })
                }
            },
            fail: (err) => {
                // 用户取消选择，不做处理
                console.log('User cancelled selection', err)
            }
        })
    },

    /**
     * 切换到个人中心
     */
    switchToProfile() {
        this.setData({ currentTab: 'profile' })
        wx.redirectTo({
            url: '/pages/profile/index'
        })
    },

    // ========== 滚动穿透处理 ==========
    preventScroll: function () {
        // 空函数，用于拦截 catchtouchmove
        return;
    }
})
