// pages/plan/plan.js
const { getOptionArray, getResultName } = require('../../util/option')
const { templateId } = require('../../config')

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCreator: false,
    loaded: false,
    notFound: false,
    registered: false,
    subscribed: false,
    registing: false,
    subscribing: false,
    submittingResult: false,
    submittingLock: false,
    reopening: false,
    showFullRecommendation: false,
    showResultPicker: false,
    resultActiveIndex: -1,
    showLockEditor: false,
    lockSettingHasChanged: false,

    hoverUser: {},
    mySelection: '',

    recommendationSettings: {
      displaySupporters: true,
    },

    title: '',
    remark: '',
    creator: '',
    option: {},
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: async function () {
    const { info: { nickName } } = await app.getUser()
    return {
      title: `${nickName ? nickName + ' ' : ''}邀请您参加 ${this.data.title}`,
      path: `pages/plan/plan?id=${this.id}`
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { registered } = await app.getUser()
    this.setData({ registered })

    const id = options.id || decodeURIComponent(options.scene)
    this.id = id

    this.watcher = this.watchPlan(id)
  },

  /**
   * 生命周期函数--监听页面销毁
   */
  onUnload: function () {
    this.watcher.close()
  },

  /**
   * 监听群约
   */
  watchPlan: function (id) {
    const watcher = db.collection('plans').doc(id).watch({
      onChange: async ({ docs: [plan], type }) => {
        if (typeof plan === 'undefined') {
          this.setData({ loaded: true, notFound: true })
          return
        }
        if (type === 'init') await this.getPlan(plan, true)
        else await this.getPlan(plan)

        if (!this.data.loaded) this.setData({ loaded: true })
      },
      onError: (err) => {
        throw err
      }
    })
    return watcher
  },

  /**
   * 获取 Plan 详细情况并写入页面数据
   * @param {object} plan
   * @param {boolean} withAnimation
   */
  getPlan: async function (plan, withAnimation) {
    const { openid: OPENID } = await app.getUser()
    const { title, remark, option, participations, subscribers, resultIndex, _creator } = plan

    // get the creator & participants
    const { data: participants } = await db.collection('users').where({
      _openid: _.in(participations.map(e => e.openid).concat(_creator))
    }).get()

    const creator = participants.find(e => e._openid === _creator)

    const formatParticipations = participations.map(({ openid, selection }) => {
      const participant = participants.find(e => e._openid === openid)
      return {
        avatar: participant && participant.info.avatar ? participant.info.avatar : '',
        nickName: participant && participant.info.nickName ? participant.info.nickName : '未注册用户',
        selection
      }
    })

    const myParticipation = participations.find(({ openid }) => openid === OPENID)

    // 如果 withoutResult, 则先初始化一个空的 resultGraph
    const withoutResult = withAnimation && typeof resultIndex === 'undefined'

    const resultGraph = this.getResultGraph(option, formatParticipations, withoutResult)
    const resultList = this.getResultList(option, formatParticipations)

    // 检查订阅通知情况
    const subscribed = subscribers && subscribers.indexOf(OPENID) > -1 ? true : false

    const result = typeof resultIndex === 'undefined' ? null : {
      index: resultIndex,
      name: getResultName(option, resultIndex)
    }

    this.setData({
      title, remark, option, subscribed,
      mySelection: myParticipation ? myParticipation.selection : '',
      participations: formatParticipations,
      creator: creator ? creator.info.nickName : '未注册用户',
      isCreator: _creator === OPENID,
      resultGraph, resultList, result
    })

    if (withoutResult) {
      setTimeout(() => {
        this.setData({ resultGraph: this.getResultGraph(option, formatParticipations) })
      }, 100)
    }
  },

  /**
   * 获取图示结果数组
   * @param {object} option
   * @param {array} participations
   * @param {boolean} withoutResult
   * @returns 结果数组
   */
  getResultGraph: function (option, participations, withoutResult) {
    const resultGraph = getOptionArray(option)
    if (withoutResult || !participations.length) {
      resultGraph.forEach(e => {
        e.votes = 0
      })
      return resultGraph
    }

    const participationArray = this.getParticipationArray(participations)
    let counter = 0
    resultGraph.forEach(e => {
      if (!e.disable) {
        e.votes = participationArray[counter].can.length
        counter++
      }
    })

    return resultGraph
  },

  /**
   * 获取列表结果
   * @param {object} option
   * @param {array} participations
   */
  getResultList: function (option, participations) {
    if (!participations.length) {
      return []
    }

    const resultList = getOptionArray(option, true)
    const participationArray = this.getParticipationArray(participations)
    let counter = 0
    resultList.forEach(e => {
      if (!e.disable) {
        e.supporters = participationArray[counter].can.map(({ avatar, nickName }) => ({ avatar, nickName }))
        e.antis = participationArray[counter].cant.map(({ avatar, nickName }) => ({ avatar, nickName }))
        counter++
      }
    })

    return resultList.filter(e => !e.disable && !e.locked && e.supporters.length > 0)
      .sort((a, b) => b.supporters.length - a.supporters.length)
  },

  /**
   * 获取报名情况数组
   * @param {array} participations
   * @returns 报名情况数组
   */
  getParticipationArray: function (participations) {
    const selectionLength = participations[0].selection.length

    return participations.map(({ avatar, nickName, selection }) => {
      return { avatar, nickName, selection: selection.split('').map(e => +e) }
    }).reduce((acc, { avatar, nickName, selection }) => {
      return acc.map((e, i) => {
        if (selection[i] === 1) e.can.push({ avatar, nickName })
        else e.cant.push({ avatar, nickName })
        return e
      })
    }, [...Array(selectionLength)].map(e => ({ can: [], cant: [] })))
  },

  /**
   * 去修改报名
   */
  handleEditParticipation: function () {
    const { title, option } = this.data
    const info = { title, option, id: this.id, lastSelection: this.data.mySelection || '' }
    wx.navigateTo({
      url: `/pages/editParticipation/editParticipation?info=${JSON.stringify(info)}`,
    })
  },

  /**
   * 展开报名结果
   */
  handleShowFullRecommendation: function () {
    this.setData({ showFullRecommendation: true })
  },

  /**
   * 用户信息 Hover
   */
  handleUserHoverStart: function ({ currentTarget }) {
    const { dataset: { avatar, nickName }, offsetLeft, offsetTop } = currentTarget
    // 适配不同放大倍率屏幕
    let { screenWidth } = wx.getSystemInfoSync()
    const ratio = 750 / screenWidth
    const offset = {
      left: offsetLeft * ratio,
      top: offsetTop * ratio
    }

    if (this.userHoverTimeout) clearTimeout(this.userHoverTimeout)
    this.userHoverStartTime = new Date()

    this.setData({
      hoverUser: {
        avatar, nickName, show: true,
        position: `left: ${offset.left - 80}rpx; top: ${offset.top - 300}rpx;`
      }
    })
  },
  handleUserHoverEnd: function () {
    const duration = new Date() - this.userHoverStartTime
    this.userHoverTimeout = setTimeout(() => {
      this.setData({
        'hoverUser.show': false
      })
    }, duration < 800 ? 800 - duration : 100)
  },

  /**
   * 订阅消息推送
   */
  subscribe: function () {
    if (templateId) {
      return new Promise((resolve, reject) => {
        wx.getSetting({
          withSubscriptions: true,
          success: ({ subscriptionsSetting }) => {
            if (!subscriptionsSetting.mainSwitch || (subscriptionsSetting.itemSettings && subscriptionsSetting.itemSettings[templateId] && subscriptionsSetting.itemSettings[templateId] === 'reject')) {
              resolve({ result: 'reject', type: 'setting' })
            } else {
              wx.requestSubscribeMessage({
                tmplIds: [templateId],
                success: (res) => resolve({ result: res[templateId], type: 'once' }),
                fail: () => reject()
              })
            }
          }
        })
      })
    }
  },

  /**
   * 订阅结果消息通知
   */
  handleSubscribeMessage: async function () {
    if (this.data.subscribing) return
    if (this.data.subscribed === true) {
      this.setData({
        subscribing: true
      })
      try {
        await wx.cloud.callFunction({
          name: 'subscribePlan',
          data: { id: this.id, action: 'unsubscribe' }
        })

        wx.showToast({
          title: '退订成功',
          icon: 'none'
        })
        this.setData({
          subscribed: false,
          subscribing: false
        })
        return
      } catch {
        this.setData({
          subscribing: false
        })
        return
      }
    }

    const { result, type } = await this.subscribe()
    if (result === 'accept') {
      this.setData({
        subscribing: true
      })
      try {
        await wx.cloud.callFunction({
          name: 'subscribePlan',
          data: { id: this.id, action: 'subscribe' }
        })

        wx.showToast({
          title: '订阅结果通知成功'
        })
        wx.vibrateShort()
        setTimeout(() => {
          wx.vibrateShort()
        }, 100)

        this.setData({
          subscribed: true,
          subscribing: false
        })
      } catch {
        this.setData({
          subscribing: false
        })
      }
    } else if (result === 'reject' && type === 'setting') {
      wx.showToast({
        title: '请开启哪天约小程序的订阅消息权限以打开结果通知',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '小程序暂不支持消息订阅',
        icon: 'none'
      })
    }
  },

  /**
   * 推荐时间列表设置更改
   */
  handleRecommendationSettingSwitch: function ({ currentTarget }) {
    const { dataset: { type } } = currentTarget
    const { recommendationSettings: { displaySupporters }} = this.data

    if (type === 'can' && displaySupporters === false) {
      this.setData({
        'recommendationSettings.displaySupporters': true
      })
    }

    if (type === 'cant' && displaySupporters === true) {
      this.setData({
        'recommendationSettings.displaySupporters': false
      })
    }
  },

  /**
   * 打开结果选择半屏弹框
   */
  handleOpenResultPicker: function () {
    this.setData({
      showResultPicker: true,
      resultActiveIndex: -1
    })
  },

  /**
   * 关闭结果选择半屏弹框
   */
  handleResultPickerClose: function () {
    this.setData({
      showResultPicker: false
    })
  },

  /**
   * 切换选中结果
   */
  handleResultPickerSwitch: function ({ currentTarget }) {
    const index = +currentTarget.id
    if (this.data.resultActiveIndex === index) return
    wx.vibrateShort()
    this.setData({
      resultActiveIndex: index
    })
  },

  /**
   * 结束报名并发送通知
   */
  handleClosePlan: async function () {
    if (this.data.submittingResult) return

    const { resultActiveIndex, resultList } = this.data
    if (resultActiveIndex < 0) {
      wx.showToast({
        title: '请先选中确定群约时间',
        icon: 'none'
      })
      return
    }

    const resultIndex = resultList[resultActiveIndex].originalIndex

    this.setData({
      submittingResult: true
    })

    try {
      await wx.cloud.callFunction({
        name: 'closePlan',
        data: {
          id: this.id,
          resultIndex
        }
      })
      this.setData({
        showResultPicker: false,
        submittingResult: false
      })
      wx.showToast({
        title: '发送成功',
      })
    } catch (err) {
      this.setData({
        showResultPicker: false,
        submittingResult: false
      })
      wx.showToast({
        title: '发送失败，请稍后重试',
        icon: 'none',
      })
    }
  },

  /**
   * 开启报名
   */
  handleReopenPlan: async function () {
    if (this.data.reopening) return

    this.setData({
      reopening: true
    })

    wx.showLoading({
      title: '开启中',
    })

    try {
      await wx.cloud.callFunction({
        name: 'reopenPlan',
        data: {
          id: this.id
        }
      })

      wx.showToast({
        title: '开启成功'
      })
      this.setData({
        reopening: false
      })
    } catch (err) {
      wx.showToast({
        title: '网络发生错误, 请稍后重试',
        icon: 'none'
      })
      this.setData({
        reopening: false
      })
    }
  },

  /**
   * 锁定选项
   */
  handleEditLock: function () {
    this.setData({
      showLockEditor: true,
      lockSettingHasChanged: false,
      resultGraph: this.data.resultGraph.map(e => {
        e.selectedLock = e.locked
        return e
      })
    })
  },

  /**
   * 切换选项 锁定/解锁
   */
  toggleLocked: function ({ currentTarget }) {
    const { index } = currentTarget.dataset
    wx.vibrateShort()

    this.setData({
      [`resultGraph[${index}].selectedLock`]: !this.data.resultGraph[index].selectedLock
    })

    // 必须分开 setData
    this.setData({
      lockSettingHasChanged: this.data.resultGraph.reduce((acc, cur) => acc || !(cur.locked === cur.selectedLock), false)
    })
  },

  /**
   * 关闭锁定选项半屏弹框
   */
  handleLockEditorClose: function () {
    this.setData({
      showLockEditor: false
    })
  },

  /**
   * 更新锁定选项
   */
  handleUpdateLock: async function () {
    if (this.data.submittingLock || !this.data.lockSettingHasChanged) return

    this.setData({
      submittingLock: true
    })

    try {
      await wx.cloud.callFunction({
        name: 'editPlanLock',
        data: {
          id: this.id,
          lock: this.data.resultGraph.filter(e => !e.disable).map(e => e.selectedLock ? 1 : 0).join('')
        }
      })
      this.setData({
        showLockEditor: false,
        submittingLock: false
      })
      wx.showToast({
        title: '锁定成功',
      })
    } catch (err) {
      this.setData({
        showLockEditor: false,
        submittingLock: false
      })
      wx.showToast({
        title: '锁定失败，请稍后重试',
        icon: 'none',
      })
    }
  },

  /**
   * 编辑群约
   */
  handleEditPlan: function () {
    if (!this.id) return
    const { title, remark } = this.data
    wx.navigateTo({
      url: `/pages/editPlan/editPlan?id=${this.id}&title=${title}&remark=${remark}`,
    })
  },

  /**
   * 获取群约分享码
   */
  handleGetQR: function () {
    if (!this.id) return
    wx.navigateTo({
      url: `/pages/qrShare/qrShare?id=${this.id}`,
    })
  },

  /**
   * 获取群约数据表格
   */
  handleGetXLSX: async function () {
    wx.showLoading({
      title: '正在导出',
    })

    try {
      const { result: { fileID } } = await wx.cloud.callFunction({
        name: 'getPlanXLSX',
        data: {
          id: this.id
        }
      })
  
      const { tempFilePath } = await wx.cloud.downloadFile({ fileID })
  
      wx.hideLoading()
  
      wx.openDocument({
        filePath: tempFilePath,
        fileType: 'xlsx',
        success: function (res) {
          console.log('打开文档成功')
        }
      })
    } catch (err) {
      wx.showToast({
        title: '导出错误，请稍后再试',
        icon: 'none',
      })
    }
  },

  /**
   * 授权信息
   */
  handleUserInfo: async function ({ detail: { userInfo } }) {
    this.setData({ registering: true })
    const registered = await app.register(userInfo)

    if (registered) {
      const { title, option } = this.data
      const info = { title, option, id: this.id }
      wx.navigateTo({
        url: `/pages/editParticipation/editParticipation?info=${JSON.stringify(info)}`,
      })
    }
    this.setData({ registering: false, registered })
  },

  /**
   * 回到首页
   */
  handleBackHome: function () {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  }
})