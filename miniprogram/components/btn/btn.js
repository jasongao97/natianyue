// components/btn/btn.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    openType: {
      type: String,
      value: null
    },
    loading: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'primary'
    },
    size: {
      type: String,
      value: 'big'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleUserInfo: async function ({ detail: { userInfo } }) {
      if (!userInfo) {
        wx.showModal({
          title: '请授权信息后继续',
          content: '哪天约需要在报名结果处显示头像和昵称，以便朋友们找到您。',
          showCancel: false,
          confirmText: '好的',
          confirmColor: '#3ABB6A'
        })
        return
      }
      this.triggerEvent('getUserInfo', { userInfo }, {})
    }
  }
})
