// 云函数入口文件
const cloud = require('wx-server-sdk')
const fetch = require('node-fetch')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { updates } = event

  try {
    if (updates.info && updates.info.avatarUrl) {
      const { data: [user] } = await db.collection('users').where({
        _openid: OPENID
      }).get()

      if (user.info.avatarUrl !== updates.info.avatarUrl) {
        const avatar = await fetch(updates.info.avatarUrl)
        const buffer = await avatar.buffer()

        const timestamp = Date.now()

        const { fileID } = await cloud.uploadFile({
          cloudPath: `avatars/${OPENID}-${timestamp}.png`, // 上传至云端的路径
          fileContent: buffer, // 小程序临时文件路径
        })
        updates.info.avatar = fileID
      } else {
        updates.info.avatar = user.info.avatar
      }
    }

    await db.collection('users').where({
      _openid: OPENID
    }).update({ data: updates })

    return { success: true, updates }
  } catch (err) {
    return err
  }
}