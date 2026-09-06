const {
  decorateNudge,
  expireDue,
  membersOf,
  plansByIds,
  todayCST,
  unique,
  userMap
} = require('./_util')
const { login } = require('./user')
const { enrichMembers } = require('./follow')

async function createPlan({ cloud, openid, payload }) {
  const title = String(payload.title || '').trim()
  if (!title) throw new Error('请填写计划名称')
  if (title.length > 20) throw new Error('名称请控制在 20 字以内')
  const dailyTargetMinutes = Math.max(1, Number(payload.dailyTargetMinutes) || 30)
  const stageTitle = String(payload.stageTitle || '第一周第一阶段').trim() || '第一周第一阶段'
  const stageTargetDays = Math.max(1, Number(payload.stageTargetDays) || 7)
  const now = Date.now()
  const plan = {
    title,
    description: String(payload.description || '').trim().slice(0, 80),
    frequency: 'daily',
    dailyTargetMinutes,
    stages: [{
      id: `s_${now}`,
      title: stageTitle.slice(0, 20),
      targetDays: stageTargetDays,
      order: 1,
      completed: false
    }],
    streak: 0,
    totalDays: 0,
    totalMinutes: 0,
    lastCheckinDate: '',
    createdBy: openid,
    createdAt: now,
    updatedAt: now
  }
  const db = cloud.database()
  const add = await db.collection('plans').add({ data: plan })
  await db.collection('plan_members').add({
    data: { planId: add._id, openid, role: 'owner', createdAt: now }
  })
  await db.collection('plan_members').add({
    data: { planId: add._id, openid, role: 'doer', createdAt: now }
  })
  return { _id: add._id, ...plan }
}

async function getPlan({ cloud, openid, payload }) {
  const planId = payload.planId
  if (!planId) throw new Error('缺少计划')
  await expireDue(cloud)
  const db = cloud.database()
  const planRes = await db.collection('plans').doc(planId).get()
  const plan = planRes.data
  if (!plan) throw new Error('计划不存在')
  const memberRes = await db.collection('plan_members').where({ planId }).limit(100).get()
  const members = await enrichMembers(cloud, memberRes.data)
  const myRoles = members.filter((item) => item.openid === openid).map((item) => item.role)
  const today = todayCST()
  const pendingRes = await db.collection('nudges').where({
    planId,
    toOpenid: openid,
    status: 'pending'
  }).orderBy('createdAt', 'desc').limit(1).get()
  const latestRes = await db.collection('nudges').where({ planId }).orderBy('createdAt', 'desc').limit(1).get()
  const users = await userMap(cloud, [
    ...pendingRes.data.map((item) => item.fromOpenid),
    ...latestRes.data.map((item) => item.fromOpenid)
  ])
  return {
    plan: { _id: plan._id || planId, ...plan },
    members,
    myRoles,
    todayChecked: plan.lastCheckinDate === today,
    pendingNudge: pendingRes.data[0]
      ? decorateNudge(pendingRes.data[0], users, plan.title)
      : undefined,
    latestNudge: latestRes.data[0]
      ? decorateNudge(latestRes.data[0], users, plan.title)
      : undefined
  }
}

async function getHome({ cloud, openid }) {
  await expireDue(cloud)
  const user = await login({ cloud, openid, payload: {} })
  const mine = await membersOf(cloud, openid)
  const doerIds = unique(mine.filter((item) => item.role === 'owner' || item.role === 'doer').map((item) => item.planId))
  const plans = await plansByIds(cloud, doerIds)
  const db = cloud.database()
  const pendingRes = await db.collection('nudges').where({
    toOpenid: openid,
    status: 'pending'
  }).orderBy('createdAt', 'desc').limit(20).get()
  const users = await userMap(cloud, pendingRes.data.map((item) => item.fromOpenid))
  const planMap = {}
  ;(await plansByIds(cloud, pendingRes.data.map((item) => item.planId))).forEach((item) => {
    planMap[item._id] = item
  })
  return {
    user,
    plans: plans.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    pendingNudges: pendingRes.data.map((item) =>
      decorateNudge(item, users, (planMap[item.planId] && planMap[item.planId].title) || item.planTitle)
    ),
    cloudReady: true
  }
}

async function getSocial({ cloud, openid }) {
  const mine = await membersOf(cloud, openid)
  const watchingIds = unique(mine.filter((item) => item.role === 'watcher').map((item) => item.planId))
  const myPlanIds = unique(mine.filter((item) => item.role === 'owner' || item.role === 'doer').map((item) => item.planId))
  const watching = await plansByIds(cloud, watchingIds)
  const myPlans = await plansByIds(cloud, myPlanIds)
  const db = cloud.database()
  const _ = db.command
  let watchers = []
  if (myPlanIds.length) {
    const res = await db.collection('plan_members').where({
      planId: _.in(myPlanIds),
      role: 'watcher'
    }).limit(100).get()
    watchers = await enrichMembers(cloud, res.data)
  }
  return {
    watching,
    myPlans: myPlans.map((plan) => ({
      ...plan,
      watchers: watchers.filter((item) => item.planId === plan._id)
    }))
  }
}

module.exports = { createPlan, getPlan, getHome, getSocial }
