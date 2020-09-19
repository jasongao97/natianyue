const { dateAdd, dateFormat } = require('./date')

module.exports = {
  /**
   * 获取用于渲染的选项数组
   * @param {plan.option} option
   * @param {boolean} withLongName - true: 返回长名称，false: 返回短名称
   * @returns optionArray
   */
  getOptionArray: (option, withLongName) => {
    let optionArray = []

    if (option.mode === 'segment') {
      for (let i = 0; i < option.segments.length; i++) {
        for (let j = 0; j < option.range; j++) {
          optionArray.push({
            name: dateFormat(dateAdd(option.startDate, j), 'dd日') + ' ' + option.segments[i]
          })
        }
      }
    } else if (option.mode === 'day') {
      const startDate = new Date(option.startDate)
      const endDate = dateAdd(startDate, option.range - 1)

      // 前补空
      for (let i = 0; i < startDate.getDay(); i++) {
        optionArray.push({
          disable: true
        })
      }

      for (let i = 0; i < option.range; i++) {
        const date = dateAdd(startDate, i)
        optionArray.push({
          name: withLongName || date.getDate() === 1 ? dateFormat(date, 'MM月dd日') : dateFormat(date, 'dd日'),
          disable: false
        })
      }

      // 后补空
      if (endDate.getDay() !== 0) {
        for (let i = endDate.getDay() + 1; i < 7; i++) {
          optionArray.push({
            disable: true
          })
        }
      }
    } else if (option.mode === 'list') {
      optionArray = option.list.map(e => ({ name: e }))
    }

    let counter = 0
    optionArray.forEach(e => {
      if (!e.disable) {
        if (option.lock) {
          e.locked = +option.lock[counter] === 1 ? true : false
        }
        e.originalIndex = counter
        counter++
      }
    })

    return optionArray
  },

  /**
  * 结果名称
  * @param {plan.option} option
  * @param {number} resultIndex - 结果索引
  * @returns 返回结果
  */
  getResultName: (option, resultIndex) => {
    if (option.mode === 'segment') {
      const segmentIndex = Math.floor(resultIndex / option.range)
      const dateIndex = resultIndex % option.range
      return dateFormat(dateAdd(option.startDate, dateIndex), 'yyyy年MM月dd日') + ' ' + option.segments[segmentIndex]
    }

    if (option.mode === 'day') {
      return dateFormat(dateAdd(option.startDate, resultIndex), 'yyyy年MM月dd日 星期D')
    }

    if (option.mode === 'list') {
      return option.list[resultIndex]
    }

    return ''
  }
}
