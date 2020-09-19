// miniprogram/pages/createPlan/createPlan.js
const app = getApp()
const { dateDiff } = require('../../util/date')

Page({
  data: {
    textareaStyle: 'padding: 32rpx 40rpx;',
    footerHeight: 0,
    step: 1,
    showWarn: false,
    showDateSelector: false, /* 日期选择器 */
    showSegmentEditor: false, /* 时段编辑器 */
    showSegmentEditorDragList: false, /* 时段编辑器中的拖拽列表 */
    submitting: false,

    title: '',
    remark: '',
    optionMode: 'segment', /* segment, day, list */
    startDate: '',
    endDate: '',
    segmentSettings: [],
    segmentSettingEdit: {
      name: '',
      segments: []
    },
    segmentSettingActiveIndex: 0,
    segmentSettingEditIndex: 0,
    options: ['']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    // 适配 iOS textarea 自带的内边距
    const system = wx.getSystemInfoSync();
    if (system.platform === 'ios') {
      this.setData({
        textareaStyle: 'padding: 18rpx 32rpx;'
      })
    }

    const { segmentSettings } = await app.getUser()
    this.setData({ segmentSettings: segmentSettings ? segmentSettings.slice() : [] })
  },


  /**
   * 生命周期函数--监听页面销毁
   */
  onUnload: async function () {
    const { segmentSeetings } = await app.getUser()
    const changed = JSON.stringify(this.data.segmentSettings) !== JSON.stringify(segmentSeetings)

    if (changed) {
      app.updateUser({ segmentSettings: this.data.segmentSettings })
    }

    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
    }
  },

  /**
   * 更新底部 padding 以适配不同高度的 footer
   */
  refreshFooter: function () {
    const query = wx.createSelectorQuery().in(this)
    query.select('#footer').boundingClientRect(({ height }) => {
      this.setData({
        footerHeight: height
      })
    }).exec()
  },

  /**
   * 切换步骤
   */
  handleStepChange: function (event) {
    // 模态框打开情况下屏蔽步骤切换
    if (this.data.showDateSelector || this.showSegmentEditor) return

    const { step } = event.detail
    if (step === this.data.step) {
      return
    }
    if (this.data.step === 1 && step === 2 && this.data.title) {
      this.setData({
        step: 2
      })
      this.refreshFooter()
    }
    if (this.data.step === 2 && step === 1) {
      this.setData({
        step: 1
      })
    }
  },

  /**
   * 导航栏按钮点击逻辑
   */
  handleNavAction: async function (event) {
    const pages = getCurrentPages()
    const back = pages && pages.length >= 2

    if (!this.data.title && !this.data.remark) {
      if (back) {
        wx.navigateBack()
      } else {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
      return
    }

    const res = await wx.showModal({
      title: `确定要${back ? '返回首页' : '进入首页'}?`,
      confirmText: `${back ? '返回首页' : '进入首页'}`,
      confirmColor: '#e64340',
      content: '您输入的信息将会不会被保留'
    })

    if (res.confirm) {
      if (back) {
        wx.navigateBack()
      } else {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
    }
  },

  /**
   * 标题输入事件
   */
  handleTitleInput: function ({ detail }) {
    this.setData({
      title: detail.value
    })
  },

  /**
   * 备注输入事件
   */
  handleRemarkInput: function ({ detail }) {
    this.setData({
      remark: detail.value
    })
  },

  /**
   * 从剪贴板粘贴至备注
   */
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
   * Tab 切换选项模式事件
   */
  handleTabSwitch: function ({ currentTarget }) {
    if (this.data.optionMode === currentTarget.id) return

    const { startDate, endDate } = this.data
    if (currentTarget.id === 'segment' && startDate && endDate && dateDiff(startDate, endDate) >= 7) {
      this.setData({
        startDate: '',
        endDate: ''
      })
    }

    wx.vibrateShort()
    this.setData({
      optionMode: currentTarget.id
    })
  },

  /**
   * 信息不完整 警告动画
   * @param {string} selector - 选择器
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
   * 下一步
   */
  handleNextStep: async function () {
    if (!this.data.title) {
      this.showWarning('#title')
      return
    }

    this.setData({
      step: 2
    })
    this.refreshFooter()
  },

  /**
   * 打开日期选择器
   */
  handleDate: function () {
    this.setData({
      showDateSelector: true
    })
  },

  /**
   * 关闭日期选择器
   */
  handleDateSelectorClose: function () {
    this.setData({
      showDateSelector: false
    })
  },

  /**
   * 日期选择器 选择日期
   */
  handleDateSelectorChange: function (event) {
    const { startDate, endDate } = event.detail
    this.setData({
      startDate, endDate
    })

    clearTimeout(this.readyToClose)
    // 完成选取后延时关闭模态框
    // 若延时阶段再次点击则清除关闭延时
    if (startDate && endDate) {
      this.readyToClose = setTimeout(() => {
        this.setData({
          showDateSelector: false
        })
        this.refreshFooter()
      }, 500);
    }
  },

  /**
   * 清除已选择的日期
   */
  handleDateSelectorClear: function () {
    this.setData({
      startDate: '', endDate: ''
    })
  },

  /**
   * 切换时段配置
   */
  handleSegmentSettingSwitch: function ({ currentTarget }) {
    const index = +currentTarget.id
    if (this.data.segmentSettingActiveIndex === index) return
    wx.vibrateShort()
    this.setData({
      segmentSettingActiveIndex: index
    })
    this.refreshFooter()
  },

  /**
   * 打开时段配置编辑器
   */
  handleSegmentSettingEdit: function ({ currentTarget }) {
    const index = +currentTarget.id

    this.setData({
      segmentSettingEdit: this.data.segmentSettings[index],
      segmentSettingEditIndex: index,
      showSegmentEditorDragList: true,
      showSegmentEditor: true
    })
  },

  /**
   * 时段配置编辑器 编辑时段
   */
  handleSegmentSettingChange: function ({ detail }) {
    const segmentSetting = Object.assign(this.data.segmentSettingEdit, { segments: detail.items })

    this.setData({
      segmentSettingEdit: segmentSetting
    })
  },

  /**
   * 时段配置编辑器 编辑名称
   */
  handleSegmentSettingNameInput: function ({ detail }) {
    const segmentSetting = Object.assign(this.data.segmentSettingEdit, { name: detail.value })

    this.setData({
      segmentSettingEdit: segmentSetting
    })
  },

  /**
   * 关闭时段配置编辑器
   */
  handleSegmentEditorClose: function () {
    this.setData({
      showSegmentEditor: false
    })
    setTimeout(() => {
      this.setData({ showSegmentEditorDragList: false })
    }, 300);
  },

  /**
   * 保存时段配置编辑
   */
  handleSegmentEditorSave: function () {
    if (!this.data.segmentSettingEdit.name || !this.data.segmentSettingEdit.segments[0]) return

    this.setData({
      [`segmentSettings[${this.data.segmentSettingEditIndex}]`]: this.data.segmentSettingEdit,
      showSegmentEditor: false,
      segmentSettingActiveIndex: this.data.segmentSettingEditIndex
    })
    setTimeout(() => {
      this.setData({ showSegmentEditorDragList: false })
    }, 300);
  },

  /**
   * 删除时段配置
   */
  handleSegmentSettingDelete: async function () {
    const { segmentSettings, segmentSettingActiveIndex: activeIndex, segmentSettingEditIndex: deletingIndex } = this.data
    if (!segmentSettings[deletingIndex]) {
      return
    }

    const res = await wx.showModal({
      title: '确定要删除这个模板吗?',
      confirmText: '确定删除',
      confirmColor: '#e64340'
    })

    if (res.cancel) {
      return
    }

    let nextActiveIndex = activeIndex
    if (deletingIndex < activeIndex) {
      nextActiveIndex -= 1
    }
    if (segmentSettings.length <= 2) {
      nextActiveIndex = 0
    }

    segmentSettings.splice(deletingIndex, 1)
    this.setData({
      segmentSettings,
      segmentSettingActiveIndex: nextActiveIndex,
      showSegmentEditor: false,
    })
    setTimeout(() => {
      this.setData({ showSegmentEditorDragList: false })
    }, 300);
  },

  /**
   * 新建时段配置
   */
  handleSegmentSettingCreate: function () {
    this.setData({
      segmentSettingEdit: { name: '', segments: [''] },
      segmentSettingEditIndex: this.data.segmentSettings.length,
      showSegmentEditorDragList: true,
      showSegmentEditor: true
    })
  },

  /**
   * 自定义选项编辑
   */
  handleListChange: function ({ detail }) {
    this.setData({ options: detail.items })
  },

  /**
   * 上一步
   */
  handleGoBackToLastStep: function () {
    this.setData({
      step: 1
    })
  },

  /**
   * 信息完整检查
   * @return {boolean} result
   */
  checkCompleteness: function () {
    const { title, optionMode, startDate, endDate, segmentSettings, segmentSettingActiveIndex, options } = this.data

    // 检查标题
    if (!title) {
      this.setData({
        step: 1
      })
      setTimeout(() => {
        this.showWarning('#title')
      }, 0)
      return false
    }

    // 检查 segment
    if (optionMode === 'segment') {
      let warningSelectors = []
      if (!segmentSettings[segmentSettingActiveIndex]) {
        warningSelectors.push('#segment-block')
      }
      if (!(startDate && endDate)) {
        warningSelectors.push('#date-block')
      }
      if (warningSelectors.length) {
        this.showWarning(warningSelectors.join(','))
        return false
      }
    }

    // 检查 day
    if (optionMode === 'day' && !(startDate && endDate)) {
      this.showWarning('#date-block')
      return false
    }

    // 检查 list
    if (optionMode === 'list' && !options.reduce((acc, cur) => acc && Boolean(cur), true)) {
      this.showWarning()
      return false
    }

    return true
  },

  /**
   * 发起群约
   */
  handleSubmit: async function () {
    if (this.data.submitting) {
      return
    }
    if (!this.checkCompleteness()) {
      return
    }

    this.setData({
      submitting: true
    })
    wx.showLoading({
      title: '发起中',
    })

    const { title, remark, optionMode, startDate, endDate, segmentSettings, segmentSettingActiveIndex, options } = this.data
    const activeSegments = segmentSettings[segmentSettingActiveIndex].segments
    const option = { mode: optionMode }
    switch (optionMode) {
      case 'segment': {
        option.startDate = startDate
        option.range = dateDiff(startDate, endDate) + 1
        option.segments = activeSegments
      } break
      case 'day': {
        option.startDate = startDate
        option.range = dateDiff(startDate, endDate) + 1
      } break
      case 'list': {
        option.list = options
      } break
    }

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'createPlan',
        data: {
          plan: {
            title,
            remark,
            option
          }
        }
      })

      this.setData({
        submitting: false
      })

      if (result._id) {
        wx.showToast({
          title: '发起成功'
        })
        this.redirectTimeout = setTimeout(() => {
          wx.redirectTo({
            url: `/pages/plan/plan?id=${result._id}`,
          })
        }, 400)
      } else {
        wx.showToast({
          title: result.msg || '未知错误',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.showToast({
        title: '网络发生错误, 请稍后重试',
        icon: 'none'
      })
      this.setData({
        submitting: false
      })
    }
  }
})
