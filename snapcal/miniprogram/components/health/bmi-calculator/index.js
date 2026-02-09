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
        result: null
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
            // 简单防抖或直接计算
            this.setData({ tempWeight: val })
            this.calculate()
        },

        calculate() {
            const { tempHeight, tempWeight } = this.data
            const res = calculateBMI(tempHeight, tempWeight)
            this.setData({ result: res })
        },

        // 保存数据并更新 Profile
        onSave() {
            const { tempHeight, tempWeight } = this.data

            // 更新本地存储的 Profile (模拟)
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
