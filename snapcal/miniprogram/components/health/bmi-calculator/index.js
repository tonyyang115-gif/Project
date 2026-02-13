const { calculateBMI } = require('../../../utils/health-algorithms')

Component({
    properties: {
        visible: {
            type: Boolean,
            value: false
        },
        userProfile: {
            type: Object,
            value: {}
        }
    },

    data: {
        tempHeight: 175,
        tempWeight: 65,
        result: null,
        needleAngle: -90 // 指针角度: -90° (左侧BMI=15) 到 90° (右侧BMI=35)
    },

    observers: {
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    tempHeight: profile.height || 175,
                    tempWeight: profile.weight || 65
                })
                // Auto calculate on load
                this.calculate()
            }
        }
    },

    lifetimes: {
        attached() {
            this.calculate()
        }
    },

    methods: {
        // 关闭弹窗
        onClose() {
            this.triggerEvent('close')
        },

        // 调整身高
        onHeightChange(e) {
            this.setData({ tempHeight: e.detail.value })
            this.calculate()
        },

        // 调整体重
        onWeightChange(e) {
            const val = e.detail.value
            this.setData({ tempWeight: val })
            this.calculate()
        },

        onHeightInput(e) {
            const input = String(e.detail.value || '').replace(/[^\d.]/g, '')
            if (!input) {
                return
            }

            const numeric = Math.round(Number(input))
            if (!Number.isFinite(numeric)) {
                return
            }

            const clamped = Math.max(100, Math.min(230, numeric))
            this.setData({ tempHeight: clamped })
            this.calculate()
        },

        onWeightInput(e) {
            const input = String(e.detail.value || '').replace(/[^\d.]/g, '')
            if (!input) {
                return
            }

            const numeric = Math.round(Number(input))
            if (!Number.isFinite(numeric)) {
                return
            }

            const clamped = Math.max(30, Math.min(150, numeric))
            this.setData({ tempWeight: clamped })
            this.calculate()
        },

        /**
         * 计算BMI和指针角度
         * BMI范围: 15-35 映射到角度 -90° 到 90°
         */
        calculate() {
            const { tempHeight, tempWeight } = this.data
            const res = calculateBMI(tempHeight, tempWeight)

            // 计算指针角度
            // BMI 15 -> -90°, BMI 35 -> 90°
            // 每单位BMI = 180° / 20 = 9°
            const minBMI = 15
            const maxBMI = 35
            const bmiValue = Math.max(minBMI, Math.min(maxBMI, res.value))
            const angle = ((bmiValue - minBMI) / (maxBMI - minBMI)) * 180 - 90

            this.setData({
                result: res,
                needleAngle: angle
            })
        },

        // 保存数据并更新 Profile
        onSave() {
            const { tempHeight, tempWeight } = this.data

            // 更新本地存储的 Profile
            const profile = wx.getStorageSync('userProfile') || {}
            profile.height = tempHeight
            profile.weight = tempWeight
            wx.setStorageSync('userProfile', profile)

            // 通知父页面更新
            this.triggerEvent('updateProfile', { height: tempHeight, weight: tempWeight })

            wx.showToast({ title: '已更新档案', icon: 'success' })
        }
    }
})
