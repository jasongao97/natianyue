// components/footer/footer.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    bg: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    safeMargin: 0,
  },

  // 组件初始化完成
  attached: function () {
    const { safeArea: { bottom }, screenHeight } = wx.getSystemInfoSync()
    this.setData({
      safeMargin: screenHeight - bottom
    })
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
