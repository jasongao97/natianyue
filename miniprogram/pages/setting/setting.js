// pages/setting/setting.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    me: null,
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
  onLoad: async function (options) {
    await this.getUser()
  },

  /**
   * 获取用户
   */
  getUser: async function () {
    const { info: { nickName, avatar }, registered } = await app.getUser()
    if (registered) {
      this.setData({
        me: {
          nickName,
          avatar
        }
      })
    }
  },

  /**
   * 更新用户信息
   */
  handleUpdateUser: async function ({ detail: { userInfo } }) {
    if (!userInfo) {
      return
    }

    wx.showLoading({
      title: '信息更新中',
    })

    try {
      await app.updateUser({
        info: userInfo
      }, true)
  
      await this.getUser()
  
      wx.showToast({
        title: '信息更新成功',
        duration: 1000
      })
    } catch {
      wx.showToast({
        title: '网络发生错误, 请稍后重试',
        icon: 'none'
      })
    }
  },

  /**
   * 时间选项模板
   */
  handleToSegmentSetting: function () {
    wx.navigateTo({
      url: '/pages/setting/segmentSetting/segmentSetting',
    })
  },

  /**
   * 已删除的群约
   */
  handleToDeletedPlans: function () {
    wx.navigateTo({
      url: '/pages/setting/deletedPlans/deletedPlans',
    })
  },

  /**
   * 关于
   */
  handleToAbout: function () {
    wx.navigateTo({
      url: '/pages/setting/about/about',
    })
  }
})