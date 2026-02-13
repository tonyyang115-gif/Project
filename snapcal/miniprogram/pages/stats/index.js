/**
 * Stats统计页面 - 数据统计和日历
 */
import { call } from '../../utils/cloudApi'

Page({
    data: {
        // 用户信息
        user: {
            targetCalories: 2000,
            targetProtein: 150,
            targetCarbs: 250,
            targetFat: 65
        },

        // 当前月份
        currentMonth: {
            year: 2024,
            month: 1
        },

        // 选中日期
        selectedDate: '',
        selectedDay: 0,
        selectedMonth: 0,

        // 日历数据
        weekDays: ['日', '一', '二', '三', '四', '五', '六'],
        calendarDays: [],

        // 月度统计
        monthlyStats: {
            avgCals: 0,
            loggedDays: 0,
            calorieBalance: 0, // 月度热量结余 (+盈余 / -缺口)
            balanceTrend: 'flat' // 'surplus' | 'deficit' | 'flat'
        },
        monthlyLoading: false,

        // 当日详情
        dailyStats: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        },
        dailyBurned: 0,
        dailyTarget: 0,
        remaining: 0,
        percent: 0,
        isOver: false,

        // 当日记录日期列表
        loggedDates: []
    },

    onLoad() {
        console.log('[Stats] 页面加载')
        this.loadUserProfile()
        this.initCalendar()
    },

    onShow() {
        // 仅在非首次加载时刷新数据（首次由 initCalendar 触发）
        if (this.hasInitialized) {
            this.loadMonthlyData()
            this.loadDailyDetail(this.data.selectedDate)
        }
    },

    loadUserProfile() {
        const profile = wx.getStorageSync('userProfile')
        if (profile) {
            this.setData({
                user: {
                    targetCalories: profile.targetCalories || 2000,
                    targetProtein: profile.targetProtein || 150,
                    targetCarbs: profile.targetCarbs || 250,
                    targetFat: profile.targetFat || 65
                }
            })
        }
    },

    initCalendar() {
        const today = new Date()
        const dateStr = this.formatDate(today)

        this.setData({
            'currentMonth.year': today.getFullYear(),
            'currentMonth.month': today.getMonth() + 1,
            selectedDate: dateStr,
            selectedDay: today.getDate(),
            selectedMonth: today.getMonth() + 1
        })

        this.generateCalendarDays()
        this.loadDailyDetail(dateStr)
        this.loadMonthlyData()  // 确保在 currentMonth 初始化后调用
        this.hasInitialized = true  // 标记已初始化
    },

    generateCalendarDays() {
        const { year, month } = this.data.currentMonth
        const daysInMonth = new Date(year, month, 0).getDate()
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

        const days = []

        // 空白格子
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: 0, date: '', isToday: false })
        }

        const today = new Date()
        const todayStr = this.formatDate(today)

        // 当月日期
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month - 1, i)
            const dateStr = this.formatDate(date)
            days.push({
                day: i,
                date: dateStr,
                isToday: dateStr === todayStr
            })
        }

        this.setData({ calendarDays: days })
    },

    formatDate(date) {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    },

    prevMonth() {
        let { year, month } = this.data.currentMonth
        month -= 1
        if (month < 1) {
            month = 12
            year -= 1
        }
        this.setData({
            'currentMonth.year': year,
            'currentMonth.month': month
        }, () => {
            this.generateCalendarDays()
            this.loadMonthlyData()
        })
    },

    nextMonth() {
        let { year, month } = this.data.currentMonth
        month += 1
        if (month > 12) {
            month = 1
            year += 1
        }
        this.setData({
            'currentMonth.year': year,
            'currentMonth.month': month
        }, () => {
            this.generateCalendarDays()
            this.loadMonthlyData()
        })
    },

    selectDay(e) {
        const { date, day } = e.currentTarget.dataset
        if (!day || day === 0) return

        this.setData({
            selectedDate: date,
            selectedDay: day,
            selectedMonth: this.data.currentMonth.month
        })

        this.loadDailyDetail(date)
    },

    async loadMonthlyData() {
        const { year, month } = this.data.currentMonth

        console.log(`[Stats] 开始加载月度数据: ${year}-${month}`)

        // 显示加载状态
        this.setData({ monthlyLoading: true })

        try {
            // 使用月度统计接口，仅需 2 次请求（原来需要 62 次！）
            const [foodRes, exerciseRes] = await Promise.all([
                call('foodService', { action: 'getMonthlyStats', data: { year, month } }),
                call('exerciseService', { action: 'getMonthlyStats', data: { year, month } })
            ])

            console.log('[Stats] 月度数据返回:', { foodRes, exerciseRes })

            let totalCalories = 0
            let totalBurned = 0
            let loggedDays = 0
            const loggedDates = []

            if (foodRes.success && foodRes.data) {
                totalCalories = foodRes.data.totalCalories || 0
                loggedDays = foodRes.data.loggedDays || 0

                // 从entries中提取已记录的日期
                if (foodRes.data.entries) {
                    const datesSet = new Set(foodRes.data.entries.map(e => e.date))
                    loggedDates.push(...datesSet)
                }
            } else {
                console.warn('[Stats] foodService 返回异常:', foodRes)
            }

            if (exerciseRes.success && exerciseRes.data) {
                totalBurned = exerciseRes.data.totalCalories || 0
            }

            // 计算平均每日摄入
            const avgCals = loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0

            // 计算月度热量结余 = 摄入 - (目标 × 记录天数 + 运动消耗)
            const targetTotal = this.data.user.targetCalories * loggedDays + totalBurned
            const netBalance = totalCalories - targetTotal
            const balanceTrend = netBalance > 0 ? 'surplus' : (netBalance < 0 ? 'deficit' : 'flat')

            console.log('[Stats] 计算结果:', { avgCals, loggedDays, netBalance })

            this.setData({
                'monthlyStats.avgCals': avgCals,
                'monthlyStats.loggedDays': loggedDays,
                'monthlyStats.calorieBalance': netBalance,
                'monthlyStats.absCalorieBalance': Math.abs(netBalance),
                'monthlyStats.balanceTrend': balanceTrend,
                loggedDates
            })
        } catch (error) {
            console.error('[Stats] 加载月度数据失败:', error)
        } finally {
            this.setData({ monthlyLoading: false })
        }
    },

    async loadDailyDetail(dateStr) {
        try {
            const [foodResult, exerciseResult] = await Promise.all([
                call('foodService', { action: 'getDailyStats', data: { date: dateStr } }),
                call('exerciseService', { action: 'getDailyStats', data: { date: dateStr } })
            ])

            let dailyStats = { calories: 0, protein: 0, carbs: 0, fat: 0 }
            let dailyBurned = 0

            if (foodResult.success) {
                dailyStats = {
                    calories: foodResult.data.totalCalories || 0,
                    protein: foodResult.data.totalProtein || 0,
                    carbs: foodResult.data.totalCarbs || 0,
                    fat: foodResult.data.totalFat || 0
                }

                // 计算宏量营养素百分比 (取整)
                if (dailyStats.calories > 0) {
                    dailyStats.proteinPercent = Math.round((dailyStats.protein * 4 / dailyStats.calories) * 100)
                    dailyStats.carbsPercent = Math.round((dailyStats.carbs * 4 / dailyStats.calories) * 100)
                    dailyStats.fatPercent = Math.round((dailyStats.fat * 9 / dailyStats.calories) * 100)
                } else {
                    dailyStats.proteinPercent = 0
                    dailyStats.carbsPercent = 0
                    dailyStats.fatPercent = 0
                }
            }

            if (exerciseResult.success) {
                dailyBurned = exerciseResult.data.totalCalories || 0
            }

            const dailyTarget = this.data.user.targetCalories + dailyBurned
            const remaining = Math.max(0, dailyTarget - dailyStats.calories)
            const percent = dailyTarget > 0 ? Math.min(100, (dailyStats.calories / dailyTarget) * 100) : 0
            const isOver = dailyStats.calories > dailyTarget

            this.setData({
                dailyStats,
                dailyBurned,
                dailyTarget,
                remaining: Math.round(remaining),
                percent: Math.round(percent),
                isOver
            })
        } catch (error) {
            console.error('[Stats] 加载日详情失败:', error)
        }
    },

    goBack() {
        // 如果是Tab页之间的跳转，返回可能不符合预期，统一跳转回首页
        wx.redirectTo({
            url: '/pages/dashboard/index'
        })
    },

    // ========== 底部导航栏 ==========

    switchToHome() {
        wx.redirectTo({
            url: '/pages/dashboard/index'
        })
    },

    switchToCamera() {
        // 跳转回Dashboard并打开相机
        wx.redirectTo({
            url: '/pages/dashboard/index?action=camera'
        })
    },

    goToHealth() {
        wx.redirectTo({
            url: '/pages/health/index'
        })
    },

    switchToProfile() {
        wx.redirectTo({
            url: '/pages/profile/index'
        })
    }
})
