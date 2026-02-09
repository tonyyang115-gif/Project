const { calculateRFM } = require('../../../utils/health-algorithms')

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
        height: 175,
        waist: 80,
        result: 0
    },

    observers: {
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    gender: profile.gender || '男',
                    height: profile.height || 175,
                    waist: profile.waist || 80
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

        onWaistChange(e) {
            this.setData({ waist: parseInt(e.detail.value) })
            this.calculate()
        },

        calculate() {
            const { gender, height, waist } = this.data
            const rfm = calculateRFM(gender, height, waist)
            this.setData({ result: rfm })
        },

        onSave() {
            const { height, waist } = this.data
            const profile = wx.getStorageSync('userProfile') || {}
            Object.assign(profile, { height, waist })
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { height, waist })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
