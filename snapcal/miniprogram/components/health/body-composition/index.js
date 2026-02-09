const { calculateBFR, calculateRFM, calculateWHR } = require('../../../utils/health-algorithms')

const TABS = {
    BFR: 'BFR',
    RFM: 'RFM',
    WHR: 'WHR'
}

Component({
    properties: {
        visible: {
            type: Boolean,
            value: false
        },
        initialTab: {
            type: String,
            value: 'BFR'
        },
        userProfile: {
            type: Object,
            value: {}
        }
    },

    data: {
        currentTab: 'BFR', // BFR, RFM, WHR

        // 用户基本数据
        gender: '男',
        age: 25,
        height: 175,
        weight: 65,

        // 围度数据 (特有)
        waist: 80,
        hip: 95,

        // 结果
        bfrResult: 0,
        rfmResult: 0,
        whrResult: { value: 0, isHealthy: true }
    },

    observers: {
        'visible': function (visible) {
            if (visible) {
                this.setData({ currentTab: this.properties.initialTab })
                this.calculateAll()
            }
        },
        'userProfile': function (profile) {
            if (profile) {
                this.setData({
                    gender: profile.gender || '男',
                    age: profile.age || 25,
                    height: profile.height || 175,
                    weight: profile.weight || 65,
                    waist: profile.waist || 80,
                    hip: profile.hip || 95
                })
                this.calculateAll()
            }
        }
    },

    methods: {
        onClose() {
            this.triggerEvent('close')
        },

        switchTab(e) {
            const tab = e.currentTarget.dataset.tab
            this.setData({ currentTab: tab })
        },

        // 输入处理
        onWaistChange(e) {
            this.setData({ waist: parseInt(e.detail.value) })
            this.calculateAll()
        },

        onHipChange(e) {
            this.setData({ hip: parseInt(e.detail.value) })
            this.calculateAll()
        },

        calculateAll() {
            const { gender, age, height, weight, waist, hip } = this.data

            // 1. BFR (依赖 BMI)
            const heightM = height / 100
            const bmi = weight / (heightM * heightM)
            const bfr = calculateBFR(gender, age, bmi)

            // 2. RFM
            const rfm = calculateRFM(gender, height, waist)

            // 3. WHR
            const whrRes = calculateWHR(gender, waist, hip)

            this.setData({
                bfrResult: bfr,
                rfmResult: rfm,
                whrResult: whrRes
            })
        },

        onSave() {
            const { waist, hip } = this.data

            // 保存围度数据到 Profile
            const profile = wx.getStorageSync('userProfile') || {}
            profile.waist = waist
            profile.hip = hip
            wx.setStorageSync('userProfile', profile)

            this.triggerEvent('updateProfile', { waist, hip })
            wx.showToast({ title: '已同步', icon: 'success' })
        }
    }
})
