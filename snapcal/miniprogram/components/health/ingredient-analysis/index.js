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
        resetState() {
            this.setData({ result: null, analyzing: false, hasHighRisk: false, requestId: '' })
        },

        doClose() {
            this.triggerEvent('close')
            setTimeout(() => {
                this.resetState()
            }, 300)
        },

        onClose() {
            if (this.data.analyzing) {
                wx.showModal({
                    title: '中断识别？',
                    content: '当前正在分析配料表，关闭后本次识别将中断。',
                    confirmText: '中断',
                    cancelText: '继续等待',
                    confirmColor: '#ef4444',
                    success: (res) => {
                        if (res.confirm) {
                            this.doClose()
                        }
                    }
                })
                return
            }

            this.doClose()
        },

        isUserCancelError(error) {
            const msg = String((error && (error.errMsg || error.message)) || '').toLowerCase()
            return msg.includes('cancel')
        },

        startScan() {
            wx.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['camera', 'album'],
                success: async (res) => {
                    this.analyzeImage(res.tempFiles[0].tempFilePath)
                },
                fail: (err) => {
                    // 取消后若当前无结果，直接关闭，避免出现空白弹层
                    if (this.isUserCancelError(err)) {
                        if (!this.data.result && !this.data.analyzing) {
                            this.onClose()
                        }
                        return
                    }

                    wx.showToast({ title: '无法访问相机或相册', icon: 'none' })
                    if (!this.data.result && !this.data.analyzing) {
                        this.onClose()
                    }
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
                    if (this.data.requestId !== requestId) return

                    // Simple check for high risk to toggle UI state
                    const hasHighRisk = data.riskLevel === 'high' ||
                        data.ingredients.some(i => i.riskLevel === 'high')

                    this.setData({
                        result: data,
                        hasHighRisk
                    })
                } else {
                    if (this.data.requestId !== requestId) return
                    wx.showToast({ title: '识别失败，请重试', icon: 'none' })
                    this.onClose()
                }

            } catch (error) {
                if (this.data.requestId !== requestId) return
                console.error('[Ingredient] Analysis failed', error)
                wx.showToast({ title: '服务繁忙，请稍后', icon: 'none' })
                this.onClose()
            } finally {
                if (this.data.requestId === requestId) {
                    this.setData({ analyzing: false })
                }
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
