const { decorateNudge, expireDue, startOfTodayCST, todayCST, userMap } = require('./_util')
const { checkin } = require('./checkin')

async function sendNudge({ cloud, openid, payload }) {
  const planId = payload.planId
  if (!planId) throw new Error('缺少计划')
  const db = cloud.database()
  const watcher = await db.collection('plan_members').where({
    planId,
    openid,
    role: 'watcher'
  }).limit(1).get()
  if (!watcher.data.length) throw new Error('关注后才能督促')

  const doerRes = await db.collection('plan_members').where({ planId, role: 'doer' }).limit(1).get()
  if (!doerRes.data.length) throw new Error('这份计划还没有执行者')
  const toOpenid = doerRes.data[0].openid
  if (toOpenid === openid) throw new Error('不能督促自己')

  const _ = db.command
  const todayCount = await db.collection('nudges').where({
    planId,
    fromOpenid: openid,
    createdAt: _.gte(startOfTodayCST())
  }).count()
  if (todayCount.total >= 2) throw new Error('今天已经督促过两次，先给他们一点空间')

  const planRes = await db.collection('plans').doc(planId).get()
  const plan = planRes.data
  const now = Date.now()
  const nudge = {
    planId,
    planTitle: plan ? plan.title : '',
    fromOpenid: openid,
    toOpenid,
    status: 'pending',
    deadlineAt: now + 30 * 60 * 1000,
    createdAt: now
  }
  const add = await db.collection('nudges').add({ data: nudge })
  const users = await userMap(cloud, [openid])
  return decorateNudge({ _id: add._id, ...nudge }, users, nudge.planTitle)
}

async function getNudge({ cloud, openid, payload }) {
  await expireDue(cloud)
  const nudgeId = payload.nudgeId
  if (!nudgeId) throw new Error('缺少督促')
  const db = cloud.database()
  const res = await db.collection('nudges').doc(nudgeId).get()
  const nudge = res.data
  if (!nudge) throw new Error('督促不存在')
  if (nudge.toOpenid !== openid && nudge.fromOpenid !== openid) {
    throw new Error('无权查看这条督促')
  }
  const users = await userMap(cloud, [nudge.fromOpenid])
  return decorateNudge(nudge, users, nudge.planTitle)
}

async function respondNudge({ cloud, openid, payload }) {
  await expireDue(cloud)
  const nudgeId = payload.nudgeId
  const action = payload.respondAction
  if (!nudgeId) throw new Error('缺少督促')
  const db = cloud.database()
  const res = await db.collection('nudges').doc(nudgeId).get()
  const nudge = res.data
  if (!nudge) throw new Error('督促不存在')
  if (nudge.toOpenid !== openid) throw new Error('只能由执行者回应')
  if (nudge.status !== 'pending') throw new Error('这条督促已经结束')

  const now = Date.now()
  if (action === 'done') {
    await db.collection('nudges').doc(nudgeId).update({
      data: { status: 'done', responseAt: now }
    })
    const planRes = await db.collection('plans').doc(nudge.planId).get()
    const alreadyToday = planRes.data && planRes.data.lastCheckinDate === todayCST()
    if (!alreadyToday) {
      await checkin({ cloud, openid, payload: { planId: nudge.planId } })
    }
    const users = await userMap(cloud, [nudge.fromOpenid])
    return decorateNudge({ ...nudge, status: 'done', responseAt: now }, users, nudge.planTitle)
  }

  if (action === 'delay') {
    const delayTo = Number(payload.delayTo)
    const delayLabel = String(payload.delayLabel || '稍后').slice(0, 20)
    if (!delayTo || delayTo <= now) throw new Error('请选择一个未来的时间')
    if (delayTo > now + 7 * 24 * 3600 * 1000) throw new Error('延迟时间过长')
    await db.collection('nudges').doc(nudgeId).update({
      data: { status: 'delayed', delayTo, delayLabel, responseAt: now }
    })
    const users = await userMap(cloud, [nudge.fromOpenid])
    return decorateNudge({
      ...nudge,
      status: 'delayed',
      delayTo,
      delayLabel,
      responseAt: now
    }, users, nudge.planTitle)
  }

  throw new Error('未知的回应方式')
}

async function expireNudges({ cloud }) {
  const count = await expireDue(cloud)
  return { expired: count }
}

module.exports = { sendNudge, getNudge, respondNudge, expireNudges }
