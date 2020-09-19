// components/drag-list/drag-list.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    list: {
      type: Array,
      value: []
    },
    addButtonName: {
      type: String,
      value: '添加'
    },
    showWarn: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 监听
   */
  observers: {
    showWarn: function (next) {
      if (next) {
        this.setData({ warning: true })
        setTimeout(() => {
          this.setData({ warning: false })
        }, 600)
      }
    }
  },

  /**
   * 未参与渲染的数据
   */
  startPageY: 0,
  itemHeight: 0,
  listTop: 0,
  listBottom: 0,

  /**
   * 组件的初始数据
   */
  data: {
    items: [],
    dragging: false,
    deleting: false,
    warning: false,
    currentIndex: -1,
    tranY: 0,
    addButtonTran: 0,
    animation: true,
    focusedIndex: -1,
  },

  /**
   * 生命周期 attached
   */
  attached: function () {
    const { safeArea: { bottom } } = wx.getSystemInfoSync()
    this.listBottom = bottom

    let items = []
    if (this.data.list.length) {
      items = this.data.list.map(item => ({ name: item }))
    } else {
      items.push({
        name: ''
      })
    }
    this.setData({ items })

    this.createSelectorQuery().selectAll('.item').boundingClientRect(items => {
      this.itemHeight = items[0].height
      this.listTop = items[0].top
      items.forEach((_, index) => {
        this.data.items[index].position = index
        this.data.items[index].tran = 0
      })
      this.setData({ items: this.data.items })
    }).exec()
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleArrangeStart: function (event) {
      if (this.data.deleting) return
      // 获取触摸点
      const [touch] = event.changedTouches
      if (!touch) return

      // 若正在触摸则返回
      if (this.data.dragging) return
      this.setData({ dragging: true })

      const { pageY } = touch
      this.setData({
        currentIndex: +event.currentTarget.id,
      })
      this.startPageY = pageY

      wx.vibrateShort()
    },
    handleArrange: function (event) {
      // 获取触摸点
      const [touch] = event.changedTouches
      if (!touch) return

      const { items, currentIndex } = this.data

      if (touch.clientY > this.listBottom - 2 * this.itemHeight) {
        wx.pageScrollTo({
          scrollTop: touch.pageY + 2 * this.itemHeight - this.listBottom,
          duration: 300,
        })
      } else if (touch.clientY < 2 * this.itemHeight + this.listTop) {
        wx.pageScrollTo({
          scrollTop: touch.pageY - 2 * this.itemHeight - this.listTop,
          duration: 300,
        })
      }

      const tranY = touch.pageY - this.startPageY

      // 计算排序偏移阈值
      if (items[currentIndex].position + 1 < items.length) {
        const [nextItem, nextItemIndex] = this.getItemByPosition(items[currentIndex].position + 1)
        const offset = (items[currentIndex].position - currentIndex) * this.itemHeight - items[currentIndex].tran
        if (tranY > offset + this.itemHeight / 2) {
          this.data.items[currentIndex].position++
          this.data.items[nextItemIndex].position--
          wx.vibrateShort()
        }
      }

      if (items[currentIndex].position > 0) {
        const [lastItem, lastItemIndex] = this.getItemByPosition(items[currentIndex].position - 1)
        const offset = (items[currentIndex].position - currentIndex) * this.itemHeight - items[currentIndex].tran
        if (tranY < offset - this.itemHeight / 2) {
          this.data.items[currentIndex].position--
          this.data.items[lastItemIndex].position++
          wx.vibrateShort()
        }
      }

      this.data.items.forEach((item, index) => {
        if (index === currentIndex) return
        item.tran = (item.position - index) * this.itemHeight
      })

      this.setData({ tranY, items: this.data.items })

      return
    },
    handleArrangeEnd: function () {
      if (!this.data.dragging) return

      const { items, currentIndex } = this.data

      this.setData({
        [`items[${currentIndex}].tran`]: (items[currentIndex].position - currentIndex) * this.itemHeight,
        dragging: false,
        currentIndex: -1,
        tranY: 0,
      })
      this.triggerListChange()

      wx.vibrateShort()
    },
    handleDelete: function ({ currentTarget }) {
      if (this.data.items.length <= 1) return
      if (this.data.deleting) return

      const index = +currentTarget.id

      if (index >= this.data.items.length) return

      const { items } = this.data
      const { position } = this.data.items[index]

      for (let i = position + 1; i < items.length; i++) {
        const [item, itemIndex] = this.getItemByPosition(i)
        this.data.items[itemIndex].position--
      }

      this.data.items[index].hide = true

      this.data.items.forEach((item, index) => {
        item.tran = (item.position - index) * this.itemHeight
      })

      this.setData({
        deleting: true,
        addButtonTran: -this.itemHeight,
        items: this.data.items
      })

      setTimeout(() => {
        this.data.items.splice(index, 1)
        this.data.items.forEach((item, index) => {
          item.tran = (item.position - index) * this.itemHeight
        })
        this.setData({ animation: false, items: this.data.items, addButtonTran: 0 })
        this.triggerListChange()
        setTimeout(() => {
          this.setData({ animation: true, deleting: false })
        }, 0);
      }, 300);
    },
    handleEdit: function ({ currentTarget, detail }) {
      const index = +currentTarget.id
      this.setData({
        [`items[${index}].name`]: detail.value
      })
      this.triggerListChange()
    },
    handleEditDone: function () {
      this.setData({
        focusedIndex: -1
      })
    },
    handleAdd: function () {
      if (this.data.deleting) return

      let focusedIndex = -1
      if (this.data.items.reduce((acc, cur) => acc && Boolean(cur.name), true)) {
        focusedIndex = this.data.items.length
      }
      this.data.items.push({
        name: '',
        position: this.data.items.length,
        tran: 0
      })
      this.setData({ items: this.data.items, focusedIndex })
      this.triggerListChange()
    },
    getItemByPosition: function (position) {
      return [this.data.items.find(item => item.position === position),
      this.data.items.findIndex(item => item.position === position)]
    },
    triggerListChange: function () {
      const items = this.data.items.slice()
      items.sort((a, b) => a.position - b.position)
      this.triggerEvent('listChange', { items: items.map(item => item.name) }, {})
    }
  }
})
