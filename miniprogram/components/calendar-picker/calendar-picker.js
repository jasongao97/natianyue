// components/calendar-picker/calendar-picker.js
const { dateAdd, dateFormat } = require('../../util/date')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    startDate: {
      type: String,
      value: ''
    },
    endDate: {
      type: String,
      value: ''
    },
    max: {
      type: Number,
      value: 0 /* 0 表示无限制 */
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    daysTitle: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    startIndex: null,
    endIndex: null
  },

  /**
   * 数据监听
   */
  observers: {
    startDate: function (startDate) {
      if (!startDate) {
        this.setData({
          startIndex: null
        })
        return
      }
      const index = this.data.days.findIndex(day => day.name === startDate)
      if (index !== -1) {
        this.setData({
          startIndex: index
        })
      }
    },
    endDate: function (endDate) {
      if (!endDate) {
        this.setData({
          endIndex: null
        })
        return
      }
      const index = this.data.days.findIndex(day => day.name === endDate)
      if (index !== -1) {
        this.setData({
          endIndex: index
        })
      }
    }
  },

  /**
   * 组件初始化完成
   */
  attached: function () {
    const today = new Date()
    const dayList = []

    // 之前的日子
    for (let i = today.getDay(); i > 0; i--) {
      const current = dateAdd(today, -i)
      dayList.push({
        name: dateFormat(current),
        date: current.getDate(),
        enable: false
      })
    }

    // 当天
    dayList.push({
      name: dateFormat(today),
      date: today.getDate(),
      remark: '今天',
      enable: true
    })

    // 100 个未来日
    for (let i = 1; i < 100; i++) {
      const current = dateAdd(today, i)
      dayList.push({
        name: dateFormat(current),
        date: current.getDate(),
        remark: current.getDate() === 1 ? `${current.getMonth() + 1}月` : '',
        enable: true
      })
    }

    this.setData({
      days: dayList
    })
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleDayTap: function (e) {
      const index = +e.currentTarget.id
      const { startIndex, endIndex, max, days } = this.data

      if (startIndex !== null && endIndex === null && index >= startIndex && max && index < startIndex + max) {
        this.triggerEvent('dateChange', { startDate: days[startIndex].name, endDate: days[index].name }, {})
        this.setData({
          endIndex: index
        })
        setTimeout(() => {
          wx.vibrateShort()
        }, 100);
      } else {
        this.triggerEvent('dateChange', { startDate: days[index].name, endDate: '' }, {})
        this.setData({
          startIndex: index,
          endIndex: null
        })
      }
      wx.vibrateShort()
    },
  }
})
