const { QwenProvider } = require('./qwenProvider')

function createAIProvider(providerName, apiKey) {
    const provider = (providerName || 'qwen').toLowerCase()

    switch (provider) {
        case 'qwen':
            return new QwenProvider(apiKey)
        default: {
            const error = new Error(`不支持的AI提供商: ${provider}`)
            error.code = 'INVALID_PROVIDER'
            throw error
        }
    }
}

module.exports = {
    createAIProvider
}
