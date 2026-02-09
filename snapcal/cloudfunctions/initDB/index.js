const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
    const db = cloud.database()
    const collections = [
        'dev_users',
        'dev_food_entries',
        'dev_exercise_entries',
        'users',
        'food_entries',
        'exercise_entries'
    ]

    const results = {}

    for (const name of collections) {
        try {
            await db.createCollection(name)
            results[name] = 'Created'
        } catch (err) {
            if (err.errCode === -502003) { // Collection already exists
                results[name] = 'Exists'
            } else {
                results[name] = `Error: ${err.message}`
            }
        }
    }

    return {
        success: true,
        results
    }
}
