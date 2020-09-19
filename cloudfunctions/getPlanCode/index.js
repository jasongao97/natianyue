// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event

  const { data: plan } = await db.collection('plans').doc(id).get()

  if (plan.code) return { fileID: plan.code, title: plan.title }

  const { buffer } = await cloud.openapi.wxacode.getUnlimited({
    scene: id,
    page: 'pages/plan/plan',
    isHyaline: true
  })

  const { fileID } = await cloud.uploadFile({
    cloudPath: `codes/${id}.png`, // 上传至云端的路径
    fileContent: buffer, // 小程序临时文件路径
  })

  await db.collection('plans').doc(id).update({
    data: {
      code: fileID
    }
  })

  return { fileID, title: plan.title }
}