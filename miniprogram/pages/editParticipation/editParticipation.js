// pages/editParticipation/editParticipation.js
const { getOptionArray } = require('../../util/option')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    infoBarHeight: 0,
    mainHeight: 0,

    allSelected: false,
    submitting: false,
    warningIndex: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    if (!options.info) {
      return
    }

    const { info } = options
    const { title, option, id, lastSelection } = JSON.parse(info)
    this.id = id

    let optionGraph = getOptionArray(option)
    if (lastSelection) {
      const lastSelectionArray = lastSelection.split('').map(e => +e)
      let counter = 0
      optionGraph = optionGraph.map(e => {
        if (!e.disable) {
          e.selected = lastSelectionArray[counter] === 1 ? true : false
          counter++
        }
        return e
      })
    }

    this.setData({ title, option, optionGraph })
    this.calculateStatus()

    this.calculateMainHeight()
  },

  /**
   * 生命周期
   */
  onUnload: function () {
    if (this.navBackTimeout) {
      clearTimeout(this.navBackTimeout)
    }
  },

  /**
   * 计算 main 高度
   */
  calculateMainHeight: function () {
    const { safeArea: { bottom }, screenHeight } = wx.getSystemInfoSync()
    const safeAreaHeight = bottom === screenHeight ? screenHeight - 16 : bottom

    wx.createSelectorQuery().in(this).select('#info-bar').boundingClientRect(({ height: infoBarHeight, bottom: topHeight }) => {
      wx.createSelectorQuery().in(this).select('#footer').boundingClientRect(({ height: bottomHeight }) => {
        this.setData({
          infoBarHeight,
          mainHeight: safeAreaHeight - topHeight - bottomHeight
        })
      }).exec()
    }).exec()
  },

  /**
   * 不可选中 警告动画
   * @param {string} [selector] - 选项索引
   */
  showWarning: async function (index) {
    this.setData({
      warningIndex: index
    })

    // 振动三次
    wx.vibrateShort()
    setTimeout(() => {
      wx.vibrateShort()
    }, 100);
    setTimeout(() => {
      wx.vibrateShort()
    }, 200);

    this.animate(`#cell${index}`, [
      { rotate: 0, ease: 'ease-out' },
      { rotate: -5, ease: 'ease-out' },
      { rotate: 5, ease: 'ease-out' },
      { rotate: -5, ease: 'ease-out' },
      { rotate: 0, ease: 'ease-out' }
    ], 200, () => {
      this.clearAnimation(`#cell${index}`)
      this.setData({
        warningIndex: -1
      })
    })
  },

  /**
   * 切换选项 选中/未选中
   */
  toggleOption: function ({ currentTarget }) {
    const { index } = currentTarget.dataset

    if (this.data.optionGraph[index].locked) {
      this.showWarning(index)
      return
    }

    wx.vibrateShort()
    this.setData({
      [`optionGraph[${index}].selected`]: !this.data.optionGraph[index].selected
    })
    this.calculateStatus()
  },

  /**
   * 选中/清除 所有
   */
  toggleAll: function () {
    const nextState = !this.data.allSelected
    const nextOptionGraph = this.data.optionGraph.map(e => {
      if (!e.disable && !e.locked) e.selected = nextState
      return e
    })
    this.setData({
      optionGraph: nextOptionGraph,
      allSelected: nextState
    })
  },

  /**
   * 计算全选状态
   */
  calculateStatus: function () {
    if (this.data.optionGraph.filter(e => !e.disable && !e.locked && e.selected).length === this.data.optionGraph.filter(e => !e.disable && !e.locked).length && this.data.allSelected === false) {
      this.setData({
        allSelected: true
      })
    } else if (this.data.allSelected === true) {
      this.setData({
        allSelected: false
      })
    }
  },

  /**
   * 提交
   */
  submit: async function () {
    this.setData({
      submitting: true
    })
    wx.showLoading({
      title: '报名中',
    })

    const selection = this.data.optionGraph.filter(e => !e.disable).map(e => (e.selected ? 1 : 0)).join('')

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'editParticipation',
        data: { id: this.id, selection },
      })
  
      this.setData({
        submitting: false
      })
  
      if (!result.success) {
        wx.showToast({
          title: result.msg || '未知错误',
          icon: 'none'
        })
        return
      }
  
      wx.showToast({
        title: '报名成功'
      })
      this.navBackTimeout = setTimeout(() => {
        wx.navigateBack()
      }, 400)
    } catch (err) {
      wx.showToast({
        title: '网络发生错误, 请稍后重试',
        icon: 'none'
      })
    }
  }
})