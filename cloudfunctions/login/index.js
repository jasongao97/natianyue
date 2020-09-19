// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const { data: [user] } = await db.collection('users').where({
    _openid: OPENID
  }).get()

  const registered = user ? true : false
  const segmentSettings = user && user.segmentSettings ? user.segmentSettings : []

  return { openid: OPENID, info: user ? user.info : {}, segmentSettings, registered }
}