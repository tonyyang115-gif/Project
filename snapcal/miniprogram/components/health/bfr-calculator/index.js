const { calculateBFR } = require('../../../utils/health-algorithms')

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
        result: 0,
        // 进度环参数
        progressColor: '#a855f7',
        circumference: 2 * Math.PI * 45 // r=45
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
        onClose() {
            this.triggerEvent('close')
        },

        onHeightChange(e) {
            this.setData({ height: parseInt(e.detail.value) })
            this.calculate()
        },

        onWeightChange(e) {
            this.setData({ weight: parseInt(e.detail.value) })
            this.calculate()
        },

        onAgeChange(e) {
            this.setData({ age: parseInt(e.detail.value) })
            this.calculate()
        },

        calculate() {
            const { gender, age, height, weight } = this.data
            // BFR 依赖 BMI
            const heightM = height / 100
            const bmi = weight / (heightM * heightM)
            const bfr = calculateBFR(gender, age, bmi)

            this.setData({ result: bfr })
        },

        onSave() {
            const { height, weight, age } = this.data
            const profile = wx.getStorageSync('userProfile') || {}
            Object.assign(profile, { height, weight, age })
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { height, weight, age })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
