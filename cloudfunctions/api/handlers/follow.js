const { displayName, userMap } = require('./_util')

async function followPlan({ cloud, openid, payload }) {
  const planId = payload.planId
  if (!planId) throw new Error('缺少计划')
  const db = cloud.database()
  const planRes = await db.collection('plans').doc(planId).get()
  if (!planRes.data) throw new Error('计划不存在')

  const existing = await db.collection('plan_members').where({ planId, openid }).limit(10).get()
  const roles = existing.data.map((item) => item.role)
  if (!roles.length) {
    await db.collection('plan_members').add({
      data: { planId, openid, role: 'watcher', createdAt: Date.now() }
    })
  } else if (roles.includes('doer') || roles.includes('owner')) {
    throw new Error('这是你自己的计划，无需关注')
  }

  const { getPlan } = require('./plan')
  return getPlan({ cloud, openid, payload: { planId } })
}

async function enrichMembers(cloud, members) {
  const users = await userMap(cloud, members.map((item) => item.openid))
  return members.map((item) => ({
    ...item,
    nickName: displayName(users[item.openid]),
    avatarUrl: (users[item.openid] && users[item.openid].avatarUrl) || ''
  }))
}

module.exports = { followPlan, enrichMembers }
