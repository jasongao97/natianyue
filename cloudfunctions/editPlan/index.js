// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, title, remark } = event

  const msgCheckPass = await checkMsgSec(title + remark)
  if (!msgCheckPass) return { msg: '内容含有违法违规内容, 请修改后重新提交' }

  const { data: plan } = await db.collection('plans').doc(id).get()
  const { _creator } = plan

  if (OPENID !== _creator) return { msg: 'Unauthorized' }

  const now = new Date()

  await db.collection('plans').doc(id).update({
    data: {
      _updatedAt: now,
      title, remark,
    }
  })

  return { success: true }
}