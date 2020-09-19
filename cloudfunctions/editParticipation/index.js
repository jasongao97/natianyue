// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database({
  throwOnNotFound: false
})
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { id, selection } = event
  const { OPENID } = cloud.getWXContext()

  const now = new Date()

  try {
    const { data: plan } = await db.collection('plans').doc(id).get()
    if (!plan) return null

    const participationIndex = plan.participations.findIndex(e => e.openid === OPENID)

    if (participationIndex === -1) {
      const participation = {
        openid: OPENID,
        selection,
        _createdAt: now,
        _updatedAt: now
      }
      await db.collection('plans').doc(id).update({
        data: {
          _updatedAt: now,
          participations: _.push(participation)
        }
      })
    } else {
      await db.collection('plans').doc(id).update({
        data: {
          _updatedAt: now,
          [`participations.${participationIndex}.selection`]: selection,
          [`participations.${participationIndex}._updatedAt`]: now
        }
      })
    }

    // 同时添加到个人首页
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        deletedPlans: _.pull(id),
        savedPlans: _.addToSet(id)
      }
    })

    return { success: true }
  } catch (err) {
    return err
  }
}