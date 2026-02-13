const { call, initSharedCloud } = require('../../../utils/cloudApi')

Component({
    properties: {
        visible: {
            type: Boolean,
            value: false
        }
    },

    data: {
        analyzing: false,
        result: null,
        hasHighRisk: false,
        requestId: ''
    },

    methods: {
        onClose() {
            this.triggerEvent('close')
            setTimeout(() => {
                this.setData({ result: null, analyzing: false, hasHighRisk: false })
            }, 300)
        },

        startScan() {
            wx.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['camera', 'album'],
                success: async (res) => {
                    this.analyzeImage(res.tempFiles[0].tempFilePath)
                },
                fail: () => {
                    // User cancelled, maybe do nothing or close if initial
                }
            })
        },

        async analyzeImage(filePath) {
            const requestId = `ing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            this.setData({ analyzing: true, result: null, requestId })

            try {
                const cloud = await initSharedCloud()

                // 1. Upload
                const uploadResult = await cloud.uploadFile({
                    cloudPath: `ingredient_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                    filePath: filePath
                })

                // 2. Call AI Service with NEW Action
                const aiResult = await call('aiService', {
                    action: 'analyzeIngredients',
                    data: {
                        imageUrl: uploadResult.fileID,
                        cleanupFileId: uploadResult.fileID,
                        requestId
                    }
                })

                if (aiResult.success && aiResult.data) {
                    const data = this.normalizeResult(aiResult.data)

                    // Simple check for high risk to toggle UI state
                    const hasHighRisk = data.riskLevel === 'high' ||
                        data.ingredients.some(i => i.riskLevel === 'high')

                    this.setData({
                        result: data,
                        hasHighRisk
                    })
                } else {
                    wx.showToast({ title: '识别失败，请重试', icon: 'none' })
                    this.onClose()
                }

            } catch (error) {
                console.error('[Ingredient] Analysis failed', error)
                wx.showToast({ title: '服务繁忙，请稍后', icon: 'none' })
                this.onClose()
            } finally {
                this.setData({ analyzing: false })
            }
        },

        normalizeResult(data) {
            const source = data && typeof data === 'object' ? data : {}
            const ingredients = Array.isArray(source.ingredients) ? source.ingredients : []
            const additives = Array.isArray(source.additives) ? source.additives : []
            const suggestions = Array.isArray(source.suggestions) ? source.suggestions : []
            const riskLevel = ['low', 'medium', 'high'].includes(source.riskLevel) ? source.riskLevel : 'low'
            const safetyScore = Number.isFinite(Number(source.safetyScore))
                ? Math.max(0, Math.min(100, Math.round(Number(source.safetyScore))))
                : 60

            return {
                productName: source.productName || '识别结果',
                safetyScore,
                riskLevel,
                summary: source.summary || '未识别到可用结论',
                ingredients,
                additives,
                suggestions
            }
        }
    }
})
