// pages/setting/deletedPlans/deletedPlans.js
const { getResultName } = require('../../../util/option')

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loaded: false,
    restoring: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    const { openid, registered } = await app.getUser()
    this.setData({ registered })

    if (registered) {
      const deletedPlans = await this.getUserDeletedPlans(openid)
      this.setData({ deletedPlans })
    }

    this.setData({ loaded: true })
  },

  /**
   * 获取用户删除的群约
   */
  getUserDeletedPlans: async function (openid) {
    const { data: [user] } = await db.collection('users').where({
      _openid: openid
    }).get()
    const { deletedPlans: userDeletedPlansId } = user

    if (!userDeletedPlansId || userDeletedPlansId.length === 0) return []
    
    const { data: userDeletedPlans } = await db.collection('plans').where({
      _id: _.in(userDeletedPlansId)
    }).orderBy('_updatedAt', 'desc').get()

    // 建立数组存放首页所有群约中的用户的 openid
    // 一起查找减少数据库操作次数
    const allParticipantsId = userDeletedPlans.reduce((participantArray, currentPlan) => {
      const currentParticipantsId = currentPlan.participations.map(participation => participation.openid)
      return participantArray.concat(currentParticipantsId)
    }, [])

    const { data: allParticipants } = await db.collection('users').where({
      _openid: _.in(allParticipantsId)
    }).get()

    const deletedPlans = userDeletedPlans.map(({ _id, _updatedAt, title, option, participations, resultIndex }) => {
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
    return deletedPlans
  },

  /**
   * 进入群约
   */
  handleEnterPlan: function ({ detail }) {
    const { index } = detail
    const id = this.data.deletedPlans[+index]._id
    wx.navigateTo({
      url: `/pages/plan/plan?id=${id}`,
    })
  },

  /**
   * 恢复群约
   */
  handleRestore: async function ({ detail }) {
    if (this.data.restoring) return

    this.setData({
      restoring: true
    })

    const { id } = detail
    await wx.cloud.callFunction({
      name: 'archivePlan',
      data: {
        action: 'restore', id
      }
    })

    this.setData({
      restoring: false
    })

    this.setData({ loaded: false })
    const { openid, registered } = await app.getUser()
    if (registered) {
      const deletedPlans = await this.getUserDeletedPlans(openid)
      this.setData({ deletedPlans })
    }
    this.setData({ loaded: true })
  },
})