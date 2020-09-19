// 云函数入口文件
const cloud = require('wx-server-sdk')
const { templateId } = require('./config')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 转换为中文日期
 * @param {Date} date - 日期
 */
const dateFormat = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${month}月${day}日`
}

/**
 * 计算日期偏移
 * @param {string|Date} input - 开始日期
 * @param {number} offset - 偏移天数
 */
const dateAdd = (input, offset) => {
  const date = new Date(input)
  date.setDate(date.getDate() + offset)
  return date
}


/**
 * 计算结果名称
 * @param {plan.option} option
 * @param {number} resultIndex - 结果索引
 * @returns 返回结果
 */
const calculateResult = (option, resultIndex) => {
  let result
  if (option.mode === 'segment') {
    const segmentIndex = Math.floor(resultIndex / option.range)
    const dateIndex = resultIndex % option.range
    result = dateFormat(dateAdd(option.startDate, dateIndex)) + option.segments[segmentIndex]
  }

  if (option.mode === 'day') {
    result = dateFormat(dateAdd(option.startDate, resultIndex))
  }

  if (option.mode === 'list') {
    result = option.list[resultIndex]
  }

  return result.length <= 20 ? result : `${result.substring(0, 18)}..`
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, resultIndex } = event

  const { data: plan } = await db.collection('plans').doc(id).get()
  const { _creator, title , option, subscribers, participations, resultIndex: planResultIndex } = plan

  if (planResultIndex) return 'The plan has already closed.'
  if (OPENID !== _creator) return 'Unauthorized'
  const now = new Date()

  try {
    if (templateId) {
      await Promise.all(subscribers.map(subscriber => {
        return cloud.openapi.subscribeMessage.send({
          touser: subscriber,
          page: `/pages/plan/plan?id=${id}`,
          data: {
            thing4: {
              value: title
            },
            thing10: {
              value: calculateResult(option, resultIndex)
            },
            number16: {
              value: participations ? participations.length : 0
            }
          },
          templateId,
          // miniprogramState: 'trial'
        }).catch(err => err)
      }))
    }

    return await db.collection('plans').doc(id).update({
      data: {
        _updatedAt: now,
        resultIndex,
        subscribers: []
      }
    })

  } catch (err) {
    return err
  }
}