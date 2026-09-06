import { CLOUD_ENV_ID } from './config'

App({
  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '提示',
        content: '当前基础库过低，请在微信开发者工具中使用 2.2.3 及以上基础库。',
        showCancel: false
      })
      return
    }
    wx.cloud.init({
      traceUser: true,
      ...(CLOUD_ENV_ID ? { env: CLOUD_ENV_ID } : {})
    })
  }
})
