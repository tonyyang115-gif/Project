const assert = require('assert')
const { __test__ } = require('../index')

function run() {
    const { normalizeIngredientResult } = __test__

    const result1 = normalizeIngredientResult({
        productName: '测试食品',
        safetyScore: '95',
        riskLevel: 'high',
        ingredients: [
            { name: '白砂糖', type: 'sugar', riskLevel: 'medium', description: '含糖较高' },
            { name: '', type: 'additive', riskLevel: 'high' }
        ],
        additives: ['柠檬酸', '', null],
        suggestions: ['适量摄入', null]
    })

    assert.strictEqual(result1.productName, '测试食品')
    assert.strictEqual(result1.safetyScore, 95)
    assert.strictEqual(result1.riskLevel, 'high')
    assert.strictEqual(result1.ingredients.length, 1)
    assert.deepStrictEqual(result1.additives, ['柠檬酸'])
    assert.deepStrictEqual(result1.suggestions, ['适量摄入'])

    const result2 = normalizeIngredientResult({
        riskLevel: 'illegal_level',
        safetyScore: 'abc',
        ingredients: [{ name: '反式脂肪', type: 'fat', riskLevel: 'high' }]
    })

    assert.strictEqual(result2.riskLevel, 'high')
    assert.strictEqual(result2.safetyScore, 60)
    assert.strictEqual(result2.productName, '未知食品')
    assert.strictEqual(result2.summary, '未识别到可用结论')
}

try {
    run()
    console.log('ingredient-schema.spec: PASS')
} catch (error) {
    console.error('ingredient-schema.spec: FAIL')
    console.error(error)
    process.exit(1)
}
