//index.js
const { getResultName } = require('../../util/option')

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    firstLoaded: false,
    loading: true,
    registering: false,
    registered: false,
    deleting: false
  },

  /**
   * 转发消息
   */
  onShareAppMessage: function () {
    return {
      title: '推荐你用这个小程序搞定群约时间难题',
      path: '/pages/index/index',
      imageUrl: '../../images/share.png',
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (option) {
    const { openid, registered } = await app.getUser()
    this.setData({ registered })

    if (registered) {
      const savedPlans = await this.getUserSavedPlans(openid)
      this.setData({ savedPlans })
    }

    this.setData({ loading: false, firstLoaded: true })
  },

  /**
   * 生命周期函数--监听小程序启动或切前台
   */
  onShow: async function () {
    if (!this.data.firstLoaded) return

    const { openid, registered } = await app.getUser()

    if (registered) {
      this.setData({ loading: true })
      const savedPlans = await this.getUserSavedPlans(openid)
      this.setData({ savedPlans, loading: false })
    }
  },

  /**
   * 成功获取用户信息回调
   */
  handleUserInfo: async function ({ detail: { userInfo } }) {
    this.setData({ registering: true })
    const registered = await app.register(userInfo)
    this.setData({ registering: false, registered })
  },

  /**
   * 获取用户保存的群约
   * @param {string} openid
   */
  getUserSavedPlans: async function (openid) {
    const { data: [user] } = await db.collection('users').where({
      _openid: openid
    }).get()
    const { savedPlans: userSavedPlansId } = user

    if (!userSavedPlansId || userSavedPlansId.length === 0) return []
    
    const { data: userSavedPlans } = await db.collection('plans').where({
      _id: _.in(userSavedPlansId)
    }).orderBy('_updatedAt', 'desc').get()

    // 建立数组存放首页所有群约中的用户的 openid
    // 一起查找减少数据库操作次数
    const allParticipantsId = userSavedPlans.reduce((participantArray, currentPlan) => {
      const currentParticipantsId = currentPlan.participations.map(participation => participation.openid)
      return participantArray.concat(currentParticipantsId)
    }, [])

    const { data: allParticipants } = await db.collection('users').where({
      _openid: _.in(allParticipantsId)
    }).get()

    const savedPlans = userSavedPlans.map(({ _id, _updatedAt, title, option, participations, resultIndex }) => {
      const participants = participations.map(({ openid }) => {
        const participant = allParticipants.find(e => e._openid === openid)
        return participant ? participant.info.nickName : '未注册用户'
      })
      const plan = { _id, _updatedAt, title, option, participants }
      if (typeof resultIndex !== 'undefined') {
        plan.result = {
          index: resultIndex,
          name: getResultName(option, resultIndex)
        }
      }
      return plan
    })
    return savedPlans
  },

  /**
   * 进入群约
   */
  handleEnterPlan: function ({ detail }) {
    const { index } = detail
    const id = this.data.savedPlans[+index]._id
    wx.navigateTo({
      url: `/pages/plan/plan?id=${id}`,
    })
  },

  /**
   * 删除群约
   */
  handleDeleted: async function ({ detail }) {
    if (this.data.deleting) return

    this.setData({
      deleting: true
    })

    const { id } = detail
    await wx.cloud.callFunction({
      name: 'archivePlan',
      data: {
        action: 'delete', id
      }
    })

    this.setData({
      deleting: false
    })

    const { openid, registered } = await app.getUser()
    if (registered) {
      this.setData({ loading: true })
      const savedPlans = await this.getUserSavedPlans(openid)
      this.setData({ savedPlans })
    }
    this.setData({ loading: false })
  },

  /**
   * 新建群约
   */
  handleCreatePlan: function () {
    wx.navigateTo({
      url: '/pages/createPlan/createPlan',
    })
  }

})
