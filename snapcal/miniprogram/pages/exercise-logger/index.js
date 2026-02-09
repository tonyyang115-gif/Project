/**
 * ExerciseLogger运动记录页面
 */
import { call } from '../../utils/cloudApi'

// 运动类型及MET值
const EXERCISE_TYPES = [
    { id: 'walking', name: '散步', met: 3.5, icon: '🚶' },
    { id: 'running', name: '跑步', met: 8.0, icon: '🏃' },
    { id: 'cycling', name: '骑行', met: 6.0, icon: '🚴' },
    { id: 'swimming', name: '游泳', met: 7.0, icon: '🏊' },
    { id: 'strength', name: '力量训练', met: 4.0, icon: '🏋️' },
    { id: 'hiit', name: 'HIIT', met: 9.0, icon: '🔥' },
    { id: 'yoga', name: '瑜伽', met: 3.0, icon: '🧘' },
    { id: 'pilates', name: '普拉提', met: 3.5, icon: '💪' },
    { id: 'hiking', name: '登山', met: 6.5, icon: '⛰️' },
    { id: 'jumprope', name: '跳绳', met: 10.0, icon: '🪢' },
    { id: 'basketball', name: '篮球', met: 6.5, icon: '🏀' },
    { id: 'football', name: '足球', met: 7.0, icon: '⚽' },
    { id: 'badminton', name: '羽毛球', met: 5.5, icon: '🏸' },
    { id: 'tennis', name: '网球', met: 7.0, icon: '🎾' },
    { id: 'pingpong', name: '乒乓球', met: 4.0, icon: '🏓' },
    { id: 'elliptical', name: '椭圆机', met: 5.0, icon: '🔄' },
    { id: 'rowing', name: '划船机', met: 7.0, icon: '🚣' },
    { id: 'aerobics', name: '有氧操', met: 6.5, icon: '💃' },
    { id: 'dancing', name: '舞蹈', met: 5.0, icon: '🕺' },
    { id: 'other', name: '其他', met: 4.0, icon: '❓' }
]

Page({
    data: {
        exerciseTypes: EXERCISE_TYPES,
        selectedType: EXERCISE_TYPES[1], // 默认跑步
        duration: 30,
        calories: 0,
        userWeight: 68,
        today: ''
    },

    onLoad() {
        const profile = wx.getStorageSync('userProfile')
        const weight = profile?.weight || 68

        const today = new Date()
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        this.setData({
            userWeight: weight,
            today: dateStr
        })

        this.calculateCalories()
    },

    selectExercise(e) {
        const { id } = e.currentTarget.dataset
        const type = EXERCISE_TYPES.find(t => t.id === id)
        if (type) {
            this.setData({ selectedType: type }, () => this.calculateCalories())
        }
    },

    onDurationChange(e) {
        this.setData({ duration: e.detail.value }, () => this.calculateCalories())
    },

    onCaloriesInput(e) {
        this.setData({ calories: Number(e.detail.value) || 0 })
    },

    calculateCalories() {
        const { selectedType, duration, userWeight } = this.data
        // 公式: Calories = MET * Weight (kg) * Duration (hours)
        const hours = duration / 60
        const estimated = Math.round(selectedType.met * userWeight * hours)
        this.setData({ calories: estimated })
    },

    async handleSave() {
        const { selectedType, duration, calories, today } = this.data

        wx.showLoading({ title: '保存中...' })

        try {
            await call('exerciseService', {
                action: 'addEntry',
                data: {
                    date: today,
                    type: selectedType.name,
                    duration: duration,
                    calories: calories
                }
            })

            wx.hideLoading()
            wx.showToast({ title: '保存成功', icon: 'success' })

            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        } catch (error) {
            wx.hideLoading()
            console.error('[ExerciseLogger] 保存失败:', error)
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    handleCancel() {
        wx.navigateBack()
    }
})
