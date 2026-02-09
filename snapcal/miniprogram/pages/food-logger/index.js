/**
 * FoodLogger食物记录页面
 */
import { call, initSharedCloud } from '../../utils/cloudApi'

Page({
    data: {
        // 模式: PHOTO, SEARCH, MANUAL
        mode: 'PHOTO',

        // 餐次类型
        mealTypes: ['早餐', '午餐', '晚餐', '加餐'],
        selectedMealType: '午餐',

        // 图片预览
        imagePreview: '',
        isAnalyzing: false,

        // 识别结果
        detectedItems: [],

        // 搜索
        searchQuery: '',

        // 手动输入表单
        manualForm: {
            name: '',
            quantity: 1,
            unit: '份',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        },

        // 今日日期
        today: ''
    },

    onLoad(options) {
        // 设置默认餐次
        const hour = new Date().getHours()
        let mealType = '午餐'
        if (hour >= 5 && hour < 10) mealType = '早餐'
        else if (hour >= 10 && hour < 15) mealType = '午餐'
        else if (hour >= 15 && hour < 22) mealType = '晚餐'
        else mealType = '加餐'

        const today = new Date()
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        this.setData({
            selectedMealType: options.meal || mealType,
            today: dateStr,
            mode: options.mode || 'PHOTO'
        })

        // 如果是拍照模式，自动打开相机
        if (this.data.mode === 'PHOTO') {
            this.openCamera()
        }
    },

    // 切换模式
    switchMode(e) {
        const { mode } = e.currentTarget.dataset
        this.setData({ mode })
        if (mode === 'PHOTO' && !this.data.imagePreview) {
            this.openCamera()
        }
    },

    // 选择餐次
    selectMealType(e) {
        const { meal } = e.currentTarget.dataset
        this.setData({ selectedMealType: meal })
    },

    // 打开相机
    openCamera() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['camera', 'album'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath
                this.setData({
                    imagePreview: tempFilePath,
                    isAnalyzing: true
                })
                this.analyzeImage(tempFilePath)
            }
        })
    },

    // AI分析图片
    async analyzeImage(filePath) {
        try {
            // 使用共享云环境上传图片
            const cloud = await initSharedCloud()
            const uploadResult = await cloud.uploadFile({
                cloudPath: `food_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                filePath: filePath
            })

            // 调用AI识别
            const aiResult = await call('aiService', {
                action: 'analyzeFood',
                data: { imageUrl: uploadResult.fileID }
            })


            if (aiResult.success && aiResult.data) {
                const items = Array.isArray(aiResult.data) ? aiResult.data : [aiResult.data]
                this.setData({
                    detectedItems: items.map((item, idx) => ({
                        id: `item_${idx}`,
                        name: item.name || '未知食物',
                        calories: item.calories || 0,
                        protein: item.protein || 0,
                        carbs: item.carbs || 0,
                        fat: item.fat || 0,
                        quantity: 1,
                        unit: '份',
                        healthScore: Number(item.healthScore) || 0,
                        healthReason: item.healthReason || ''
                    }))
                })
                console.log('[FoodLogger] Detected Items:', this.data.detectedItems)
            }
        } catch (error) {
            console.error('[FoodLogger] AI识别失败:', error)
            wx.showToast({ title: '识别失败', icon: 'none' })
        } finally {
            this.setData({ isAnalyzing: false })
        }
    },

    // 重新拍照
    retakePhoto() {
        this.setData({
            imagePreview: '',
            detectedItems: []
        })
        this.openCamera()
    },

    // 搜索食物
    onSearchInput(e) {
        this.setData({ searchQuery: e.detail.value })
    },

    async handleSearch() {
        const { searchQuery } = this.data
        if (!searchQuery.trim()) return

        this.setData({ isAnalyzing: true })

        try {
            const result = await call('aiService', {
                action: 'analyzeNutrition',
                data: { foodName: searchQuery }
            })

            if (result.success && result.data) {
                const newItem = {
                    id: `item_${Date.now()}`,
                    name: result.data.name || searchQuery,
                    calories: result.data.calories || 200,
                    protein: result.data.protein || 10,
                    carbs: result.data.carbs || 25,
                    fat: result.data.fat || 8,
                    quantity: 1,
                    unit: '份'
                }
                this.setData({
                    detectedItems: [...this.data.detectedItems, newItem],
                    searchQuery: ''
                })
            }
        } catch (error) {
            console.error('[FoodLogger] 搜索失败:', error)
            // 添加默认值
            const newItem = {
                id: `item_${Date.now()}`,
                name: searchQuery,
                calories: 200,
                protein: 10,
                carbs: 25,
                fat: 8,
                quantity: 1,
                unit: '份'
            }
            this.setData({
                detectedItems: [...this.data.detectedItems, newItem],
                searchQuery: ''
            })
        } finally {
            this.setData({ isAnalyzing: false })
        }
    },

    // 手动输入相关
    onManualInput(e) {
        const { field } = e.currentTarget.dataset
        let value = e.detail.value
        if (['quantity', 'calories', 'protein', 'carbs', 'fat'].includes(field)) {
            value = Number(value) || 0
        }
        this.setData({
            [`manualForm.${field}`]: value
        })
    },

    addManualItem() {
        const { manualForm, detectedItems } = this.data
        if (!manualForm.name) {
            wx.showToast({ title: '请输入食物名称', icon: 'none' })
            return
        }

        const newItem = {
            id: `item_${Date.now()}`,
            ...manualForm
        }

        this.setData({
            detectedItems: [...detectedItems, newItem],
            manualForm: {
                name: '',
                quantity: 1,
                unit: '份',
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            }
        })
    },

    // 移除项目
    removeItem(e) {
        const { id } = e.currentTarget.dataset
        this.setData({
            detectedItems: this.data.detectedItems.filter(item => item.id !== id)
        })
    },

    // 更新项目
    updateItem(e) {
        const { id, field } = e.currentTarget.dataset
        let value = e.detail.value
        if (['quantity', 'calories', 'protein', 'carbs', 'fat'].includes(field)) {
            value = Number(value) || 0
        }

        const items = this.data.detectedItems.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value }
            }
            return item
        })
        this.setData({ detectedItems: items })
    },

    // 清空列表
    clearAll() {
        wx.showModal({
            title: '确认清空',
            content: '确定要清空所有已添加的食物吗？',
            success: (res) => {
                if (res.confirm) {
                    this.setData({ detectedItems: [] })
                }
            }
        })
    },

    // 保存记录
    async handleSave() {
        const { detectedItems, selectedMealType, today, imagePreview } = this.data

        if (detectedItems.length === 0) {
            wx.showToast({ title: '请添加食物', icon: 'none' })
            return
        }

        wx.showLoading({ title: '保存中...' })

        try {
            // 逐个添加食物记录
            for (const item of detectedItems) {
                await call('foodService', {
                    action: 'addEntry',
                    data: {
                        date: today,
                        meal: selectedMealType,
                        name: item.name,
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                        imageUrl: imagePreview || ''
                    }
                })
            }

            wx.hideLoading()
            wx.showToast({ title: '保存成功', icon: 'success' })

            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        } catch (error) {
            wx.hideLoading()
            console.error('[FoodLogger] 保存失败:', error)
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    // 取消
    handleCancel() {
        wx.navigateBack()
    },

    // 计算总计
    getTotalCalories() {
        return this.data.detectedItems.reduce((sum, item) => sum + item.calories, 0)
    }
})
