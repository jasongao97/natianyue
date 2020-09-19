// components/avatar/avatar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    src: {
      type: String,
      value: '',
    },
    animation: {
      type: Boolean,
      value: true
    },
    avatarStyle: {
      type: String,
      value: ''
    },
    disable: {
      type: Boolean,
      value: false
    }
  },

  observers: {
    src: function (src) {
      if (this.lastSrc === src) return
      if (src) {
        this.setData({
          loaded: false,
          failed: false
        })
      } else {
        this.setData({
          loaded: true,
          failed: true
        })
      }

      this.lastSrc = src
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loaded: false,
    failed: false,
    imageSrc: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleLoaded: function () {
      this.setData({
        loaded: true
      })
    },

    handleError: function (event) {
      this.setData({
        loaded: true,
        failed: true
      })
    }
  }
})
