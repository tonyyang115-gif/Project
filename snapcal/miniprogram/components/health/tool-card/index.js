Component({
    properties: {
        tool: {
            type: String,
            value: ''
        },
        icon: {
            type: String,
            value: ''
        },
        name: {
            type: String,
            value: ''
        },
        desc: {
            type: String,
            value: ''
        },
        iconColor: {
            type: String,
            value: 'blue' // blue, orange, purple, etc.
        }
    },

    methods: {
        onTap() {
            this.triggerEvent('select', { tool: this.properties.tool })
        }
    }
})
