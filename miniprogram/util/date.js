/**
 * 转换为中文星期
 * @param {number} day
 */
const _CHNDay = (day) => {
  return ['日', '一', '二', '三', '四', '五', '六'][day]
}

/**
 * 计算日期偏移
 * @param {Date} input - 开始日期
 * @param {number} offset - 偏移天数
 */
const dateAdd = (input, offset) => {
  const date = new Date(input)
  date.setDate(date.getDate() + offset)
  return date
}


/**
 * 计算两个日期相差的天数
 * @param {Date} first - 开始日期
 * @param {Date} second - 结束日期
 */
const dateDiff = (first, second) => {
  const date1 = new Date(first)
  const date2 = new Date(second)
  return Math.abs(date1 - date2) / (1000 * 60 * 60 * 24)
}

/**
 * 按模板输出日期，默认为 yyyy-MM-dd
 * @param {string|Date} date - 日期
 * @param {string} [form] - 模板
 */
const dateFormat = (date, form) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = _CHNDay(date.getDay())

  if (form) {
    return form.replace('yyyy', year).replace('MM', month).replace('dd', day).replace('D', weekday)
  }

  return [year, month, day].map(n => {
    n = n.toString()
    return n[1] ? n : '0' + n
  }).join('-')
}

module.exports = {
  dateAdd,
  dateFormat,
  dateDiff,
}