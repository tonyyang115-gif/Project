/**
 * 健康工具核心算法库
 * 纯函数设计，便于测试和复用
 */

/**
 * 计算 BMI
 * @param {number} heightCm - 身高 (cm)
 * @param {number} weightKg - 体重 (kg)
 * @returns {object} { value: number, status: string, color: string }
 */
export const calculateBMI = (heightCm, weightKg) => {
    const heightM = heightCm / 100
    const bmi = weightKg / (heightM * heightM)
    const value = parseFloat(bmi.toFixed(1))

    let status = '正常'
    let color = 'green'

    if (value < 18.5) {
        status = '偏瘦'
        color = 'blue'
    } else if (value >= 28.0) {
        status = '肥胖'
        color = 'red'
    } else if (value >= 24.0) {
        status = '超重'
        color = 'orange'
    }

    return { value, status, color }
}

/**
 * 计算 BMR (Mifflin-St Jeor 公式)
 * @param {string} gender - '男' | '女'
 * @param {number} age 
 * @param {number} heightCm 
 * @param {number} weightKg 
 * @returns {number} kcal/day
 */
export const calculateBMR = (gender, age, heightCm, weightKg) => {
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age)
    bmr += (gender === '男' ? 5 : -161)
    return Math.round(bmr)
}

/**
 * 计算 BFR 体脂率 (Deurenberg 公式)
 * @param {string} gender - '男' | '女'
 * @param {number} age 
 * @param {number} bmi 
 * @returns {number} percentage
 */
export const calculateBFR = (gender, age, bmi) => {
    const sexValue = gender === '男' ? 1 : 0
    const bfr = (1.20 * bmi) + (0.23 * age) - (10.8 * sexValue) - 5.4
    return parseFloat(bfr.toFixed(1))
}

/**
 * 计算 RFM 相对脂肪量
 * @param {string} gender 
 * @param {number} heightCm 
 * @param {number} waistCm 
 * @returns {number} percentage
 */
export const calculateRFM = (gender, heightCm, waistCm) => {
    const sexCoeff = gender === '男' ? 0 : 1
    const rfm = 64 - (20 * (heightCm / waistCm)) + (12 * sexCoeff)
    return parseFloat(rfm.toFixed(1))
}

/**
 * 计算 WHR 腰臀比
 * @param {string} gender 
 * @param {number} waistCm 
 * @param {number} hipCm 
 * @returns {object} { value: number, isHealthy: boolean }
 */
export const calculateWHR = (gender, waistCm, hipCm) => {
    const whr = waistCm / hipCm
    const value = parseFloat(whr.toFixed(2))
    const isHealthy = gender === '男' ? value < 0.9 : value < 0.85
    return { value, isHealthy }
}

/**
 * 计算燃脂心率区间
 * @param {number} age 
 * @returns {object} { maxHr, burnMin, burnMax }
 */
export const calculateHeartRate = (age) => {
    const maxHr = 220 - age
    const burnMin = Math.round(maxHr * 0.6)
    const burnMax = Math.round(maxHr * 0.8)
    return { maxHr, burnMin, burnMax }
}
