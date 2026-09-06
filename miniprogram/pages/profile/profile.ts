import { api, withBusy } from '../../services/api'
import { formatDuration } from '../../utils/format'

Page({
  data: {
    nickName: '',
    avatarUrl: '',
    planCount: 0,
    totalDays: 0,
    durationText: '0 分钟',
    cloudHint: ''
  },
  onShow() {
    this.load()
  },
  async load() {
    const home = await withBusy('加载中', () => api.getHome())
    if (!home) {
      this.setData({ cloudHint: '若持续失败，请先开通云开发并上传云函数 api。' })
      return
    }
    const totalDays = home.plans.reduce((sum, plan) => sum + (plan.totalDays || 0), 0)
    const totalMinutes = home.plans.reduce((sum, plan) => sum + (plan.totalMinutes || 0), 0)
    this.setData({
      nickName: home.user.nickName || '',
      avatarUrl: home.user.avatarUrl || '',
      planCount: home.plans.length,
      totalDays,
      durationText: formatDuration(totalMinutes),
      cloudHint: ''
    })
  },
  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    this.setData({ avatarUrl: e.detail.avatarUrl })
    this.saveProfile()
  },
  onNickBlur(e: WechatMiniprogram.Input) {
    this.setData({ nickName: e.detail.value })
    this.saveProfile()
  },
  async saveProfile() {
    const nickName = this.data.nickName.trim()
    let avatarUrl = this.data.avatarUrl
    if (!nickName && !avatarUrl) return
    if (avatarUrl && !avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('https://')) {
      try {
        const up = await wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}.png`,
          filePath: avatarUrl
        })
        avatarUrl = up.fileID
        this.setData({ avatarUrl })
      } catch (err) {
        console.error(err)
      }
    }
    await withBusy('保存中', () => api.updateProfile(nickName, avatarUrl))
  }
})
