/**
 * 状态管理器 - 简单的发布/订阅模式
 * 功能：全局状态管理、状态订阅
 */

export class StateManager {
    /**
     * @param {object} initialState - 初始状态
     */
    constructor(initialState = {}) {
        this.state = initialState
        this.listeners = new Map()  // key -> Set(callbacks)
    }

    /**
     * 获取状态值
     * @param {string} key - 状态键
     * @returns {any} 状态值
     */
    get(key) {
        return this.state[key]
    }

    /**
     * 获取所有状态
     * @returns {object} 完整状态对象
     */
    getAll() {
        return { ...this.state }
    }

    /**
     * 设置状态值并通知订阅者
     * @param {string} key - 状态键
     * @param {any} value - 新值
     */
    set(key, value) {
        const oldValue = this.state[key]

        // 值未变化则不触发更新
        if (oldValue === value) return

        this.state[key] = value

        // 通知订阅者
        const callbacks = this.listeners.get(key)
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(value, oldValue)
                } catch (error) {
                    console.error('[StateManager] 回调执行错误', error)
                }
            })
        }
    }

    /**
     * 批量更新状态
     * @param {object} updates - 更新对象
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value)
        })
    }

    /**
     * 订阅状态变化
     * @param {string} key - 状态键
     * @param {function} callback - 回调函数 (newValue, oldValue) => {}
     * @returns {function} 取消订阅函数
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set())
        }

        this.listeners.get(key).add(callback)

        // 返回取消订阅函数
        return () => {
            const callbacks = this.listeners.get(key)
            if (callbacks) {
                callbacks.delete(callback)

                // 如果没有订阅者了，删除该key
                if (callbacks.size === 0) {
                    this.listeners.delete(key)
                }
            }
        }
    }

    /**
     * 重置状态
     * @param {object} newState - 新状态（可选）
     */
    reset(newState = {}) {
        this.state = newState
        this.listeners.clear()
    }
}

export default StateManager
