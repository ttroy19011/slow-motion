const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const res = await cloud.callFunction({
    name: 'api',
    data: { action: 'expireNudges' }
  })
  return res.result
}
