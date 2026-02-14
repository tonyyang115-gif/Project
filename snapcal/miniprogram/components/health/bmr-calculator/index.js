const { calculateBMR } = require('../../../utils/health-algorithms')

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
        gender: '男',
        age: 25,
        height: 175,
        weight: 65,
        result: 0
    },

    observers: {
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    gender: profile.gender || '男',
                    age: profile.age || 25,
                    height: profile.height || 175,
                    weight: profile.weight || 65
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

        onGenderToggle() {
            this.setData({ gender: this.data.gender === '男' ? '女' : '男' })
            this.calculate()
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

        onHeightChange(e) {
            this.setData({ height: parseInt(e.detail.value) })
            this.calculate()
        },

        onWeightChange(e) {
            this.setData({ weight: parseInt(e.detail.value) })
            this.calculate()
        },

        calculate() {
            const { gender, age, height, weight } = this.data
            const bmr = calculateBMR(gender, age, height, weight)
            this.setData({ result: bmr })
        },

        onSave() {
            const { gender, age, height, weight } = this.data

            // 模拟保存
            const profile = wx.getStorageSync('userProfile') || {}
            Object.assign(profile, { gender, age, height, weight })
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { gender, age, height, weight })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
