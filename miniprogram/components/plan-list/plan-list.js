// components/plan-list/plan-list.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    plans: {
      type: Array,
      value: []
    },
    action: {
      type: String,
      value: null
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 属性监听
   */
  observers: {
    loading: function (loading) {
      if (loading === false) {
        this.setData({ move: 0 })
        this.open = false
      }
    }
  },

  /**
   * 未参与渲染的数据
   */
  open: false,
  offset: 0,
  actionButtonWidth: 0,
  nextMovingIndex: -1,

  /**
   * 组件的初始数据
   */
  data: {
    movingIndex: -1,
    move: 0
  },

  /**
   * ready 生命周期
   */
  ready() {
    const { windowWidth } = wx.getSystemInfoSync()
    this.actionButtonWidth = (windowWidth || 375) / 375 * 80
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 滚动监听
     */
    handleMove: function (event) {
      const { x, source } = event.detail
      const { index } = event.currentTarget.dataset

      this.offset = x

      if (this.data.movingIndex !== index && this.nextMovingIndex !== index && source === 'touch') {
        this.setData({ move: 0 })
        this.nextMovingIndex = index
        this.open = false
      }
    },

    /**
     * 打开
     */
    setOpen: function (index) {
      if (this.nextMovingIndex === index) {
        this.setData({
          move: -this.actionButtonWidth,
          movingIndex: index
        })
        this.open = true
      }
    },

    /**
     * 关闭
     */
    setClose: function (index) {
      if (this.nextMovingIndex === index) {
        this.setData({
          move: 0,
          movingIndex: index
        })
        this.open = false
      }
    },

    /**
     * 滚动结束
     */
    handleMoveEnd: function (event) {
      const { index } = event.currentTarget.dataset

      if (!this.open) {
        if (this.offset < -20) {
          this.setOpen(index)
        } else {
          this.setClose(index)
        }
      } else {
        if (this.offset > -this.actionButtonWidth + 10) {
          this.setClose(index)
        } else {
          this.setOpen(index)
        }
      }
    },

    /**
     * 点击群约
     */
    handlePlanEnter: function (event) {
      const { index } = event.currentTarget.dataset

      this.setData({ move: 0 })
      this.open = false

      this.triggerEvent('enter', { index }, {})
    },

    /**
     * 删除群约
     */
    handleDelete: async function (event) {
      const { id } = event.currentTarget.dataset

      this.triggerEvent('delete', { id }, {})
    },

    /**
     * 恢复群约
     */
    handleRestore: async function (event) {
      const { id } = event.currentTarget.dataset

      this.triggerEvent('restore', { id }, {})
    }
  }
})
