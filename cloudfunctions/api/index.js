const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const { login, updateProfile } = require('./handlers/user')
const { createPlan, getPlan, getHome, getSocial, getProfile } = require('./handlers/plan')
const { checkin } = require('./handlers/checkin')
const { followPlan } = require('./handlers/follow')
const { sendNudge, getNudge, respondNudge, expireNudges } = require('./handlers/nudge')

const handlers = {
  login,
  updateProfile,
  createPlan,
  getPlan,
  getHome,
  getProfile,
  getSocial,
  checkin,
  followPlan,
  sendNudge,
  getNudge,
  respondNudge,
  expireNudges
}

function friendlyError(err) {
  const message = (err && err.message) || String(err)
  if (/COLLECTION_NOT_EXIST|not exist|Db or Table not exist/i.test(message)) {
    return '请先在云开发控制台创建集合：users、plans、plan_members、checkins、nudges'
  }
  if (/Environment|env not/i.test(message)) {
    return '请在 miniprogram/config.ts 填写云环境 ID，并上传云函数 api'
  }
  return message || '服务异常'
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event
  const fn = handlers[action]
  if (!fn) {
    return { ok: false, error: `未知操作：${action || ''}` }
  }
  if (action !== 'expireNudges' && !OPENID) {
    return { ok: false, error: '请在微信中打开小程序' }
  }
  try {
    const data = await fn({
      cloud,
      openid: OPENID,
      payload: event
    })
    return { ok: true, data }
  } catch (err) {
    console.error(action, err)
    return { ok: false, error: friendlyError(err) }
  }
}
