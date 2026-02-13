/**
 * 通义千问 AI 服务提供者
 */
class QwenProvider {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('QWEN_API_KEY未配置')
        }

        this.apiKey = apiKey
        this.apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
        this.timeout = 30000  // 30秒超时
        this.promptVersions = {
            foodImage: 'food-image-v1',
            ingredientImage: 'ingredient-image-v1',
            nutrition: 'nutrition-v1'
        }
    }

    /**
     * 分析食物图片
     * @param {string} imageInput - 图片URL或Base64
     * @returns {Promise<object>} 识别结果
     */
    async analyzeFoodImage(imageInput) {
        const isBase64 = imageInput.startsWith('data:image') || !imageInput.startsWith('http')

        const messages = [{
            role: 'user',
            content: [
                {
                    image: isBase64 ? imageInput : imageInput
                },
                {
                    text: '请识别图片中的食物，并返回以下JSON格式的数据：\n' +
                        '{\n' +
                        '  "foodName": "食物名称",\n' +
                        '  "calories": 卡路里数值,\n' +
                        '  "protein": 蛋白质克数,\n' +
                        '  "carbs": 碳水化合物克数,\n' +
                        '  "fat": 脂肪克数,\n' +
                        '  "quantity": "份量描述",\n' +
                        '  "healthScore": 0-10整数 (基于营养密度、加工程度评分，例如汉堡3-5分，沙拉8-10分),\n' +
                        '  "healthReason": "简短评价(15字以内)"\n' +
                        '}\n' +
                        '只返回JSON，不要其他文字。'
                }
            ]
        }]

        const requestBody = {
            model: 'qwen-vl-max',
            input: { messages },
            parameters: {
                max_tokens: 500
            }
        }

        try {
            const response = await this._request(requestBody)

            // 解析响应
            const content = response.output?.choices?.[0]?.message?.content?.[0]?.text

            if (!content) {
                throw new Error('AI返回内容为空')
            }

            // 提取JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('AI返回格式错误，未找到JSON')
            }

            const result = JSON.parse(jsonMatch[0])

            // 验证必需字段
            if (!result.foodName || typeof result.calories !== 'number') {
                throw new Error('AI返回数据不完整')
            }

            return result
        } catch (error) {
            console.error('[QwenProvider] 图片识别失败', error)
            throw this._toProviderError(error, 'AI_PROVIDER_ERROR', `AI识别失败: ${error.message}`)
        }
    }

    /**
     * 分析配料表图片
     * @param {string} imageInput - 图片URL或Base64
     * @returns {Promise<object>} 分析结果
     */
    async analyzeIngredientImage(imageInput) {
        const isBase64 = imageInput.startsWith('data:image') || !imageInput.startsWith('http')

        const messages = [{
            role: 'user',
            content: [
                {
                    image: isBase64 ? imageInput : imageInput
                },
                {
                    text: '你是一个食品安全专家。请识别图片配料表，并返回JSON数据（不要Markdown）：\n' +
                        '{\n' +
                        '  "productName": "推测食品名称",\n' +
                        '  "safetyScore": 整数0-100(越高越健康),\n' +
                        '  "riskLevel": "low"|"medium"|"high",\n' +
                        '  "summary": "一句话评价",\n' +
                        '  "ingredients": [\n' +
                        '    { "name": "成分名", "type": "common|additive|allergen|sugar|fat", "riskLevel": "low|medium|high", "description": "简短说明风险成分" }\n' +
                        '  ],\n' +
                        '  "additives": ["添加剂名"],\n' +
                        '  "suggestions": ["建议1", "建议2", "建议3"]\n' +
                        '}'
                }
            ]
        }]

        const requestBody = {
            model: 'qwen-vl-max',
            input: { messages },
            parameters: { max_tokens: 1500 }
        }

        try {
            const response = await this._request(requestBody)
            const content = response.output?.choices?.[0]?.message?.content?.[0]?.text

            if (!content) {
                throw this._buildError('AI_PARSE_ERROR', 'AI无响应')
            }

            const clean = content.replace(/```json\n?|\n?```/g, '')
            const jsonMatch = clean.match(/\{[\s\S]*\}/)

            if (!jsonMatch) {
                throw this._buildError('AI_PARSE_ERROR', '格式解析失败')
            }

            try {
                return JSON.parse(jsonMatch[0])
            } catch (error) {
                throw this._buildError('AI_PARSE_ERROR', `JSON解析失败: ${error.message}`)
            }
        } catch (error) {
            console.error('[QwenProvider] 配料分析失败', error)
            throw this._toProviderError(error, 'AI_PROVIDER_ERROR', `AI分析失败: ${error.message}`)
        }
    }

    getPromptVersion(task) {
        return this.promptVersions[task] || 'unknown'
    }

    /**
     * 营养分析
     * @param {string} foodName - 食物名称
     * @param {string} quantity - 份量
     * @returns {Promise<object>} 营养信息
     */
    async analyzeNutrition(foodName, quantity = '100克') {
        const messages = [{
            role: 'user',
            content: `请分析"${foodName}"（${quantity}）的营养成分，返回JSON格式：\n` +
                '{\n' +
                '  "foodName": "食物名称",\n' +
                '  "calories": 卡路里数值,\n' +
                '  "protein": 蛋白质克数,\n' +
                '  "carbs": 碳水化合物克数,\n' +
                '  "fat": 脂肪克数\n' +
                '}\n' +
                '只返回JSON。'
        }]

        const requestBody = {
            model: 'qwen-plus',
            input: { messages },
            parameters: {
                result_format: 'message',
                max_tokens: 300
            }
        }

        try {
            const response = await this._request(requestBody, 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation')

            const content = response.output?.choices?.[0]?.message?.content

            if (!content) {
                throw new Error('AI返回内容为空')
            }

            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('AI返回格式错误')
            }

            return JSON.parse(jsonMatch[0])
        } catch (error) {
            console.error('[QwenProvider] 营养分析失败', error)
            throw this._toProviderError(error, 'AI_PROVIDER_ERROR', `营养分析失败: ${error.message}`)
        }
    }

    /**
     * 发送请求到通义千问API
     */
    async _request(body, endpoint = this.apiEndpoint) {
        const https = require('https')
        const url = new URL(endpoint)

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(this._buildError('AI_TIMEOUT', 'AI_TIMEOUT'))
            }, this.timeout)

            const postData = JSON.stringify(body)

            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            }

            const req = https.request(options, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    clearTimeout(timeoutId)

                    if (res.statusCode !== 200) {
                        reject(this._buildError('AI_PROVIDER_ERROR', `API请求失败: ${res.statusCode}`))
                        return
                    }

                    try {
                        const result = JSON.parse(data)

                        if (result.code) {
                            reject(this._buildError('AI_PROVIDER_ERROR', `API错误: ${result.code} - ${result.message}`))
                            return
                        }

                        resolve(result)
                    } catch (error) {
                        reject(this._buildError('AI_PROVIDER_ERROR', `JSON解析失败: ${error.message}`))
                    }
                })
            })

            req.on('error', (error) => {
                clearTimeout(timeoutId)
                reject(this._buildError('AI_PROVIDER_ERROR', `网络请求失败: ${error.message}`))
            })

            req.on('timeout', () => {
                clearTimeout(timeoutId)
                req.destroy()
                reject(this._buildError('AI_TIMEOUT', 'AI_TIMEOUT'))
            })

            req.write(postData)
            req.end()
        })
    }

    _buildError(code, message) {
        const error = new Error(message)
        error.code = code
        return error
    }

    _toProviderError(error, fallbackCode, fallbackMessage) {
        if (error && error.code) {
            return error
        }

        const wrapped = new Error(fallbackMessage)
        wrapped.code = fallbackCode
        wrapped.cause = error
        return wrapped
    }
}

module.exports = { QwenProvider }
