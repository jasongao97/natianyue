// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 提取 Plan 中需要检查的文本
 * @param {Plan} plan
 * @returns {string}
 */
const flattenPlan = (plan) => {
  let content = `${plan.title}${plan.remark}` || ''
  if (plan.option.mode === 'list') {
    content += plan.option.list.reduce((acc, cur) => acc + cur, '')
  }
  if (plan.option.mode === 'segment') {
    content += plan.option.segments.reduce((acc, cur) => acc + cur, '')
  }
  return content
}

/**
 * 检查文本安全
 * @param {string} content - 文本内容
 * @returns {boolean}
 */
const checkMsgSec = async (content) => {
  try {
    await cloud.openapi.security.msgSecCheck({ content })
    return true
  } catch (err) {
    return false
  }
}

/**
 * 检查 Plan 完全性
 * @param {Plan} plan
 * @returns {boolean}
 */
const checkCompleteness = (plan) => {
  if (!(plan.title && plan.option)) return false

  const { option } = plan
  if (!option.mode) return false
  switch (option.mode) {
    case 'segment': {
      if (!(option.startDate && option.range && option.segments && option.segments.length)) return false
    } break
    case 'day': {
      if (!(option.startDate && option.range)) return false
    } break
    case 'list': {
      if (!(option.list && option.list.length)) return false
    } break
  }

  return true
}

/**
 * 过滤 plan 对象中的属性
 * @param {Plan} plan
 * @returns {Plan} 
 */
const filterPlan = ({ title, remark, option }) => {
  const plan = {
    title,
    remark
  }

  switch (option.mode) {
    case 'segment': {
      const { startDate, range, segments } = option
      plan.option = { startDate, range, segments }
    } break
    case 'day': {
      const { startDate, range } = option
      plan.option = { startDate, range }
    } break
    case 'list': {
      const { list } = option
      plan.option = { list }
    } break
  }
  plan.option.mode = option.mode

  return plan
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { plan } = event

  if (!checkCompleteness(plan)) return { msg: '信息不完整' }

  const msgCheckPass = await checkMsgSec(flattenPlan(plan))
  if (!msgCheckPass) return { msg: '内容含有违法违规内容, 请修改后重新提交' }

  const data = filterPlan(plan)

  data.participations = []
  data.subscribers = []

  data._creator = OPENID
  const now = new Date()
  data._createdAt = now
  data._updatedAt = now

  try {
    const { _id } = await db.collection('plans').add({ data })

    // 同时添加到个人首页
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        savedPlans: _.addToSet(_id)
      }
    })
    return { _id }
  } catch (err) {
    return { msg: '数据库写入错误' }
  }
}
