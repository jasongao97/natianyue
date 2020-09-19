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
  const { id, action } = event

  if (action === 'delete') {
    return await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        savedPlans: _.pull(id),
        deletedPlans: _.addToSet(id)
      }
    })

  }
  if (action === 'restore') {
    return await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        savedPlans: _.addToSet(id),
        deletedPlans: _.pull(id)
      }
    })
  }
}