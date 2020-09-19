// components/half-modal/half-modal.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '标题'
    },
    description: {
      type: String,
      value: ''
    },
    rightButtonName: {
      type: String,
      value: '清除'
    },
    rightButtonColor: {
      type: String,
      value: '#888'
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    render: false,
    safeMargin: 0
  },

  /**
   * 组件初始化完成
   */
  attached: function () {
    const { safeArea: { bottom }, screenHeight } = wx.getSystemInfoSync()
    this.setData({
      safeMargin: screenHeight - bottom
    })
  },

  /**
   * 数据监听
   */
  observers: {
    show: function (show) {
      if (show) {
        this.setData({
          render: true
        })
      } else {
        // 动画结束再移除渲染
        setTimeout(() => {
          this.setData({
            render: false
          })
        }, 300)
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    doNothing: function () {
      return
    },

    handleModalClose: function () {
      this.triggerEvent('modalClose', {}, {})
    },

    handleRightButtonTap: function () {
      this.triggerEvent('rightButtonTap', {}, {})
    }
  }
})
