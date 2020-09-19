const { env } = require('./config')

//app.js
App({
  onLaunch: function () {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // 环境 ID
        env,
        traceUser: true,
      })
    }

    // wx.getSetting().then(res => console.log(res))

    this.globalData = {}
  },

  /**
   * 获取用户信息及授权情况
   */
  getUser: async function () {
    if (this.globalData.user) {
      return this.globalData.user
    }

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })
      const { openid, info, segmentSettings, registered } = result
      this.globalData.user = { openid, info, segmentSettings, registered }
  
      return this.globalData.user
    } catch (err) {
      return this.globalData.user
    }
  },

  /**
   * 注册授权
   */
  register: async function (userInfo) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'register',
        data: { userInfo }
      })
      const { openid, info, segmentSettings, registered } = result
      if (registered) {
        this.globalData.user = { openid, info, segmentSettings, registered }
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  },

  /**
   * 更新用户信息
   * @param {object} updates
   * @param {boolean} hard
   */
  updateUser: async function (updates, hard) {
    if (!hard) {
      Object.assign(this.globalData.user, updates)
    }

    try {
      const { result: { updates: cloudUpdates } } = await wx.cloud.callFunction({
        name: 'updateUser',
        data: { updates },
      })
  
      Object.assign(this.globalData.user, cloudUpdates)
    } catch (err) {
      return err
    }
  }
})
