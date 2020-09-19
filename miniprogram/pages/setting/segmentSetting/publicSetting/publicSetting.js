// pages/setting/segmentSetting/publicSetting/publicSetting.js
const app = getApp()
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    publicSettings: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { userSettings } = options

    const publicSettings = await this.getPublicSettings(JSON.parse(userSettings))
    this.setData({
      publicSettings,
      loading: false
    })
  },

  /**
   * 获取公共模板
   */
  getPublicSettings: async function (userSettings = []) {
    const { data: publicSettings } = await db.collection('segment_settings').where({
      draft: false
    }).get()

    const settings = publicSettings.map(({ name, segments }) => {
      return {
        name, segments,
        saved: userSettings.find(e => {
          const last = { name: e.name, segments: e.segments }
          return JSON.stringify(last) === JSON.stringify({ name, segments })
        })
      }
    })

    return settings
  },

  /**
   * 保存模板
   */
  saveSetting: function ({ currentTarget }) {
    const { index } = currentTarget.dataset

    const setting = this.data.publicSettings[index]

    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prePage = pages[pages.length - 2];

      prePage.addSegmentSetting(setting)
    }

    this.setData({
      [`publicSettings[${index}].saved`]: true
    })
  }
})