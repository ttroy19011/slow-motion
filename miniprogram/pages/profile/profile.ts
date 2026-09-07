import { api, withBusy } from '../../services/api'
import { formatDuration, planLifecycle } from '../../utils/format'
import type { Plan } from '../../types/index'

interface PlanGroup {
  key: string
  title: string
  plans: Plan[]
}

Page({
  data: {
    nickName: '',
    avatarUrl: '',
    planCount: 0,
    totalDays: 0,
    durationText: '0 分钟',
    cloudHint: '',
    checkinCounts: {} as Record<string, number>,
    groups: [] as PlanGroup[],
    emptyPlans: true
  },
  onShow() {
    this.load()
  },
  async load() {
    const data = await withBusy('加载中', () => api.getProfile())
    if (!data) {
      this.setData({ cloudHint: '若持续失败，请先开通云开发并重新上传云函数 api。' })
      return
    }
    const totalDays = data.plans.reduce((sum, plan) => sum + (plan.totalDays || 0), 0)
    const totalMinutes = data.plans.reduce((sum, plan) => sum + (plan.totalMinutes || 0), 0)
    this.setData({
      nickName: data.user.nickName || '',
      avatarUrl: data.user.avatarUrl || '',
      planCount: data.plans.length,
      totalDays,
      durationText: formatDuration(totalMinutes),
      checkinCounts: data.checkinCounts || {},
      groups: buildGroups(data.plans),
      emptyPlans: data.plans.length === 0,
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
  onOpenPlan(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    wx.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${e.detail.id}` })
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

function buildGroups(plans: Plan[]): PlanGroup[] {
  const active: Plan[] = []
  const future: Plan[] = []
  const done: Plan[] = []
  plans.forEach((plan) => {
    const status = planLifecycle(plan)
    if (status === 'done') done.push(plan)
    else if (status === 'future') future.push(plan)
    else active.push(plan)
  })
  const groups: PlanGroup[] = []
  if (active.length) groups.push({ key: 'active', title: '进行中', plans: active })
  if (future.length) groups.push({ key: 'future', title: '尚未开始 / 未来计划', plans: future })
  if (done.length) groups.push({ key: 'done', title: '已完成', plans: done })
  return groups
}
