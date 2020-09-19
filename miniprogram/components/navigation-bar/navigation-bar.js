// components/navigation-bar/navigation-bar.js
Component({
  // 组建的属性
  properties: {
    title: {
      type: String,
      value: '哪天约'
    },
    action: {
      type: String,
      value: null
    },
    actionOverride: {
      type: Boolean,
      value: false
    },
    step: {
      type: Number,
      value: null
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  // 组件的初始数据
  data: {
    bubble: {},
    statusBarHeight: 0,
    actionBarHeight: 0,
    stepBarHeight: 30
  },

  // 组件初始化完成
  attached: function () {
    const { height, width, right } = wx.getMenuButtonBoundingClientRect()
    const { statusBarHeight, system, screenWidth } = wx.getSystemInfoSync()

    const pages = getCurrentPages()
    if (pages.length < 2 && this.data.action === 'back') {
      this.setData({
        action: 'home'
      })
    }
    this.setData({
      bubble: {
        height,
        width: width / 2,
        left: screenWidth - right + 4,
      },
      statusBarHeight,
      actionBarHeight: system.indexOf('iOS') === -1
        ? 48 // Android
        : 44 // iOS
    })
  },

  // 组件的方法
  methods: {
    // 点击动作按钮
    handleActionButtonTap: function () {
      // 父组件重写方法
      if (this.data.actionOverride) {
        this.triggerEvent('action', {}, {})
        return
      }

      switch (this.data.action) {
        case 'setting': {
          wx.navigateTo({
            url: '/pages/setting/setting'
          })
          return
        }
        case 'back': {
          const pages = getCurrentPages()
          if (pages && pages.length >= 2) {
            wx.navigateBack()
          }
          return
        }
        case 'home': {
          wx.reLaunch({
            url: '/pages/index/index'
          })
          return
        }
      }
    },
    // 点击步骤栏
    handleStepBarTap: function (event) {
      const step = +event.currentTarget.id
      if (step === 1 || step === 2) {
        this.triggerEvent('stepChange', { step }, {})
      }
    }
  }
})
