// components/avatar/index.js
Component({
  properties: {
    url: {
      type: String,
      value: '',
      observer: function(newVal) {
        // 确保url始终是字符串
        if (newVal === null || newVal === undefined) {
          this.setData({
            url: ''
          });
        }
      }
    },
    alt: {
      type: String,
      value: '',
      observer: function(newVal) {
        // 确保alt始终是字符串
        if (newVal === null || newVal === undefined) {
          this.setData({
            alt: ''
          });
        }
      }
    },
    size: {
      type: String,
      value: 'md', // xs, sm, md, lg, xl
    },
    customClass: {
      type: String,
      value: '',
    },
  },
  data: {},
  methods: {},
  attached() {
    // 组件附加时确保属性值正确
    if (this.properties.url === null || this.properties.url === undefined) {
      this.setData({ url: '' });
    }
    if (this.properties.alt === null || this.properties.alt === undefined) {
      this.setData({ alt: '' });
    }
  },
});


