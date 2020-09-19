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
  const { id, lock } = event

  const { data: plan } = await db.collection('plans').doc(id).get()
  const { _creator } = plan

  if (OPENID !== _creator) return { msg: 'Unauthorized' }

  const now = new Date()

  await db.collection('plans').doc(id).update({
    data: {
      _updatedAt: now,
      'option.lock': lock
    }
  })

  return { success: true }
}