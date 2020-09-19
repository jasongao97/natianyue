// pages/editPlan/editPlan.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    textareaStyle: 'padding: 32rpx 40rpx;',
    saving: false,
    showWarn: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 适配 iOS textarea 自带的内边距
    const system = wx.getSystemInfoSync();
    if (system.platform === 'ios') {
      this.setData({
        textareaStyle: 'padding: 18rpx 32rpx;'
      })
    }

    const { id, title = '', remark = '' } = options

    this.id = id
    this.setData({
      title, remark
    })
  },

  /**
   * 生命周期
   */
  onUnload: function () {
    if (this.navBackTimeout) {
      clearTimeout(this.navBackTimeout)
    }
  },

  // 输入标题
  handleTitleInput: function ({ detail }) {
    this.setData({
      title: detail.value
    })
  },

  // 输入备注
  handleRemarkInput: function ({ detail }) {
    this.setData({
      remark: detail.value
    })
  },

  // 从剪贴板复制
  handleClipboard: async function () {
    const { data } = await wx.getClipboardData()

    if (data) {
      wx.showToast({
        title: '粘贴成功',
        icon: 'none'
      })
      this.setData({
        remark: data
      })
    } else {
      wx.showToast({
        title: '剪贴板是空的哦...',
        icon: 'none'
      })
    }
  },

  /**
   * 信息不完整 警告动画
   * @param {string} [selector] - 选择器
   */
  showWarning: async function (selector) {
    this.setData({
      showWarn: true
    })

    // 振动三次
    wx.vibrateShort()
    setTimeout(() => {
      wx.vibrateShort()
    }, 100);
    setTimeout(() => {
      wx.vibrateShort()
    }, 200);

    if (selector) {
      this.animate(selector, [
        { translateX: 0, ease: 'ease-out' },
        { translateX: -5, ease: 'ease-out' },
        { translateX: 5, ease: 'ease-out' },
        { translateX: -5, ease: 'ease-out' },
        { translateX: 5, ease: 'ease-out' },
        { translateX: -5, ease: 'ease-out' },
        { translateX: 0, ease: 'ease-out' }
      ], 400, () => {
        this.clearAnimation(selector)
        this.setData({
          showWarn: false
        })
      })
    } else {
      setTimeout(() => {
        this.setData({
          showWarn: false
        })
      }, 400);
    }
  },

  /**
   * 保存
   */
  handleSave: async function () {
    if (this.data.saving) return

    const { title, remark } = this.data
    if (!title) {
      this.showWarning('#title')
      return
    }

    this.setData({
      saving: true
    })

    const { result } = await wx.cloud.callFunction({
      name: 'editPlan',
      data: {
        id: this.id,
        title,
        remark
      }
    })

    this.setData({
      saving: false
    })

    if (result.success) {
      wx.showToast({
        title: '保存成功'
      })
      this.navBackTimeout = setTimeout(() => {
        wx.navigateBack()
      }, 400)
    } else {
      wx.showToast({
        title: result.msg || '未知错误',
        icon: 'none'
      })
    }
  }
})