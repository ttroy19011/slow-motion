function todayCST(ts = Date.now()) {
  return new Date(ts + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const t = Date.parse(`${dateStr}T00:00:00.000+08:00`) + days * 86400000
  return new Date(t + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function startOfTodayCST() {
  return Date.parse(`${todayCST()}T00:00:00.000+08:00`)
}

function unique(list) {
  return [...new Set(list.filter(Boolean))]
}

function displayName(user) {
  const name = user && user.nickName && String(user.nickName).trim()
  return name || '亲友'
}

async function userMap(cloud, openids) {
  const db = cloud.database()
  const _ = db.command
  const ids = unique(openids)
  if (!ids.length) return {}
  const res = await db.collection('users').where({ openid: _.in(ids) }).limit(100).get()
  const map = {}
  res.data.forEach((item) => {
    map[item.openid] = item
  })
  return map
}

async function plansByIds(cloud, ids) {
  const db = cloud.database()
  const _ = db.command
  const planIds = unique(ids)
  if (!planIds.length) return []
  const res = await db.collection('plans').where({ _id: _.in(planIds) }).limit(100).get()
  return res.data
}

async function membersOf(cloud, openid) {
  const db = cloud.database()
  const res = await db.collection('plan_members').where({ openid }).limit(100).get()
  return res.data
}

async function expireDue(cloud) {
  const db = cloud.database()
  const _ = db.command
  const now = Date.now()
  const res = await db.collection('nudges').where({
    status: 'pending',
    deadlineAt: _.lte(now)
  }).limit(100).get()
  await Promise.all(res.data.map((item) =>
    db.collection('nudges').doc(item._id).update({
      data: { status: 'expired', responseAt: now }
    })
  ))
  return res.data.length
}

function decorateNudge(nudge, users, planTitle) {
  const from = users[nudge.fromOpenid]
  return {
    ...nudge,
    planTitle: planTitle || nudge.planTitle || '',
    fromName: displayName(from)
  }
}

function currentStageComplete(plan) {
  const stages = plan.stages || []
  let changed = false
  const next = stages.map((stage) => {
    if (!stage.completed && plan.totalDays >= stage.targetDays) {
      changed = true
      return { ...stage, completed: true }
    }
    return stage
  })
  return { stages: next, changed }
}

module.exports = {
  todayCST,
  addDays,
  startOfTodayCST,
  unique,
  displayName,
  userMap,
  plansByIds,
  membersOf,
  expireDue,
  decorateNudge,
  currentStageComplete
}
