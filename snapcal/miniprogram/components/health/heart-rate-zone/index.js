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
        normalizeAge(value) {
            const num = parseInt(value, 10)
            if (!Number.isFinite(num)) return this.data.age || 25
            return Math.max(10, Math.min(100, num))
        },

        applyAge(age) {
            this.setData({ age: this.normalizeAge(age) })
            this.calculate()
        },

        onClose() {
            this.triggerEvent('close')
        },

        onAgeAdjust(e) {
            const delta = parseInt(e.currentTarget.dataset.delta, 10) || 0
            this.applyAge(this.data.age + delta)
        },

        onAgeInput(e) {
            this.applyAge(e.detail.value)
        },

        onAgeSliderChange(e) {
            this.applyAge(e.detail.value)
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
