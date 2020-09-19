// pages/setting/segmentSetting/segmentSetting.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showSegmentEditor: false, /* 时段编辑器 */
    showSegmentEditorDragList: false, /* 时段编辑器中的拖拽列表 */

    segmentSettings: [],
    segmentSettingEdit: {
      name: '',
      segments: []
    },
    segmentSettingEditIndex: 0,
  },

  // /**
  //  * 分享时间选项模板
  //  */
  // onShareAppMessage: function () {
  //   const { segmentSettingEdit, showSegmentEditor } = this.data
  //   if (!(segmentSettingEdit.name && segmentSettingEdit.segments[0] && showSegmentEditor)) return
  //   return {
  //     title: `用这个约 ${segmentSettingEdit.name} 超方便`,
  //     path: `pages/index/index?segmentSetting=${JSON.stringify(segmentSettingEdit)}`
  //   }
  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { segmentSettings } = await app.getUser()
    this.setData({ segmentSettings: segmentSettings.slice() })
  },

  /**
   * 退出时保存
   */
  onUnload: async function () {
    const { segmentSettings } = await app.getUser()
    const changed = JSON.stringify(this.data.segmentSettings) !== JSON.stringify(segmentSettings)

    if (changed) {
      await app.updateUser({ segmentSettings: this.data.segmentSettings })
    }
  },

  // 打开公共模板库
  handleToPublicSetting: function () {
    wx.navigateTo({
      url: `/pages/setting/segmentSetting/publicSetting/publicSetting?userSettings=${JSON.stringify(this.data.segmentSettings)}`
    })
  },

  // 打开时段配置编辑
  handleSegmentSettingEdit: function ({ currentTarget }) {
    const index = +currentTarget.id

    this.setData({
      segmentSettingEdit: this.data.segmentSettings[index],
      segmentSettingEditIndex: index,
      showSegmentEditorDragList: true,
      showSegmentEditor: true
    })
  },

  // 时段编辑
  handleSegmentSettingChange: function ({ detail }) {
    const segmentSetting = {
      name: this.data.segmentSettingEdit.name,
      segments: detail.items
    }
    this.setData({
      segmentSettingEdit: segmentSetting
    })
  },

  // 时段配置名称编辑
  handleSegmentSettingNameInput: function ({ detail }) {
    const segmentSetting = {
      name: detail.value,
      segments: this.data.segmentSettingEdit.segments
    }
    this.setData({
      segmentSettingEdit: segmentSetting
    })
  },

  // 关闭时段配置编辑
  handleSegmentEditorClose: function () {
    this.setData({
      showSegmentEditor: false
    })
    setTimeout(() => {
      this.setData({ showSegmentEditorDragList: false })
    }, 300);
  },

  // 保存时段配置编辑
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

  // 删除时段配置
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

  // 新建时段配置
  handleSegmentSettingCreate: function () {
    this.setData({
      segmentSettingEdit: { name: '', segments: [''] },
      segmentSettingEditIndex: this.data.segmentSettings.length,
      showSegmentEditorDragList: true,
      showSegmentEditor: true
    })
  },

  // 添加模板
  addSegmentSetting: function (setting) {
    if (setting.name && setting.segments && setting.segments.length) {
      this.data.segmentSettings.push(setting)
      this.setData({
        segmentSettings: this.data.segmentSettings
      })
    }
  }
})