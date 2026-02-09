const { calculateWHR } = require('../../../utils/health-algorithms')

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
        waist: 80,
        hip: 95,
        result: { value: 0, isHealthy: true },
        bodyShape: 'pear', // 'apple' or 'pear'
        percent: 0 // For scale cursor
    },

    observers: {
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    gender: profile.gender || '男',
                    waist: profile.waist || 80,
                    hip: profile.hip || 95
                })
                this.calculate()
            }
        }
    },

    methods: {
        onClose() {
            this.triggerEvent('close')
        },

        onWaistChange(e) {
            this.setData({ waist: parseInt(e.detail.value) })
            this.calculate()
        },

        onHipChange(e) {
            this.setData({ hip: parseInt(e.detail.value) })
            this.calculate()
        },

        calculate() {
            const { gender, waist, hip } = this.data
            const res = calculateWHR(gender, waist, hip)

            // Determine shape and cursor position
            // Male > 0.9 = Apple, Female > 0.85 = Apple
            const threshold = gender === '男' ? 0.9 : 0.85
            const isApple = res.value > threshold

            // Calculate cursor % (0.6 to 1.2 range mapped to 0-100%)
            let pct = (res.value - 0.6) / 0.6 * 100
            pct = Math.max(0, Math.min(100, pct))

            this.setData({
                result: res,
                bodyShape: isApple ? 'apple' : 'pear',
                percent: pct
            })
        },

        onSave() {
            const { waist, hip } = this.data
            const profile = wx.getStorageSync('userProfile') || {}
            Object.assign(profile, { waist, hip })
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { waist, hip })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
