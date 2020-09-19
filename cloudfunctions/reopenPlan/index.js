// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event

  const { data: plan } = await db.collection('plans').doc(id).get()
  const { _creator, resultIndex } = plan

  if (typeof resultIndex === 'undefined') return 'The plan is still open.'
  if (OPENID !== _creator) return 'Unauthorized'
  const now = new Date()

  return await db.collection('plans').doc(id).update({
    data: {
      _updatedAt: now,
      resultIndex: _.remove()
    }
  })
}