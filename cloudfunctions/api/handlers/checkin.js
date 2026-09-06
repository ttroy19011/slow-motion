const { currentStageComplete, todayCST, addDays } = require('./_util')

async function checkin({ cloud, openid, payload }) {
  const planId = payload.planId
  if (!planId) throw new Error('缺少计划')
  const db = cloud.database()
  const member = await db.collection('plan_members').where({
    planId,
    openid,
    role: 'doer'
  }).limit(1).get()
  if (!member.data.length) throw new Error('只有执行者可以打卡')

  const planRes = await db.collection('plans').doc(planId).get()
  const plan = planRes.data
  if (!plan) throw new Error('计划不存在')

  const minutes = Math.max(1, Number(payload.minutes) || plan.dailyTargetMinutes || 30)
  const today = todayCST()
  const yesterday = addDays(today, -1)
  const alreadyToday = plan.lastCheckinDate === today

  let streak = plan.streak || 0
  let totalDays = plan.totalDays || 0
  if (!alreadyToday) {
    streak = plan.lastCheckinDate === yesterday ? streak + 1 : 1
    totalDays += 1
  }

  const nextPlan = {
    ...plan,
    streak,
    totalDays,
    totalMinutes: (plan.totalMinutes || 0) + minutes,
    lastCheckinDate: today,
    updatedAt: Date.now()
  }
  const stage = currentStageComplete(nextPlan)
  nextPlan.stages = stage.stages

  await db.collection('plans').doc(planId).update({
    data: {
      streak: nextPlan.streak,
      totalDays: nextPlan.totalDays,
      totalMinutes: nextPlan.totalMinutes,
      lastCheckinDate: nextPlan.lastCheckinDate,
      stages: nextPlan.stages,
      updatedAt: nextPlan.updatedAt
    }
  })

  await db.collection('checkins').add({
    data: {
      planId,
      openid,
      date: today,
      minutes,
      createdAt: Date.now()
    }
  })

  return { _id: planId, ...nextPlan }
}

module.exports = { checkin }
