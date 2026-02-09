const { calculateHeartRate } = require('../../../utils/health-algorithms')

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
        age: 25,
        maxHr: 0,
        burnMin: 0,
        burnMax: 0
    },

    observers: {
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    age: profile.age || 25
                })
                this.calculate()
            }
        }
    },

    methods: {
        onClose() {
            this.triggerEvent('close')
        },

        onAgeChange(e) {
            this.setData({ age: parseInt(e.detail.value) })
            this.calculate()
        },

        calculate() {
            const { age } = this.data
            const res = calculateHeartRate(age)
            this.setData({
                maxHr: res.maxHr,
                burnMin: res.burnMin,
                burnMax: res.burnMax
            })
        },

        onSave() {
            const { age } = this.data
            // 模拟保存
            const profile = wx.getStorageSync('userProfile') || {}
            profile.age = age
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { age })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
