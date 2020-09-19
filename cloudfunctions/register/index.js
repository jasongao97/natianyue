// 云函数入口文件
const cloud = require('wx-server-sdk')
const fetch = require('node-fetch')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 初始模板
const segmentSettings = [
  {
    name: '🍗饭局',
    segments: ['午餐', '晚餐']
  },
  {
    name: '🎬电影',
    segments: ['上午', '下午', '晚上']
  },
  {
    name: '💼会议',
    segments: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00']
  },
]

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const { data: [user] } = await db.collection('users').where({
    _openid: OPENID
  }).get()

  if (user) {
    const { info, segmentSettings } = user
    return { openid: OPENID, info, segmentSettings, registered: true }
  }

  const avatar = await fetch(event.userInfo.avatarUrl)
  const buffer = await avatar.buffer()

  const timestamp = Date.now()

  const { fileID } = await cloud.uploadFile({
    cloudPath: `avatars/${OPENID}-${timestamp}.png`, // 上传至云端的路径
    fileContent: buffer, // 小程序临时文件路径
  })

  event.userInfo.avatar = fileID

  const now = new Date()

  await db.collection('users').add({
    data: {
      info: event.userInfo,
      segmentSettings,
      _registeredAt: now,
      _openid: OPENID
    }
  })

  return { openid: OPENID, info: event.userInfo, segmentSettings, registered: true }
}