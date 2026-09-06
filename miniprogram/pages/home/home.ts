import { api, withBusy } from '../../services/api'
import { formatRemain, todayLabel } from '../../utils/date'
import type { Nudge, Plan } from '../../types/index'

Page({
  data: {
    loading: true,
    greeting: todayLabel(),
    plans: [] as Plan[],
    pendingNudges: [] as Array<Nudge & { remain: string }>,
    empty: false
  },
  timer: 0 as number,
  onShow() {
    this.setData({ greeting: todayLabel() })
    this.load()
  },
  onHide() {
    this.clearTimer()
  },
  onUnload() {
    this.clearTimer()
  },
  async load() {
    const data = await withBusy('加载中', () => api.getHome())
    if (!data) {
      this.setData({ loading: false, empty: true })
      return
    }
    this.setData({
      loading: false,
      plans: data.plans,
      empty: data.plans.length === 0,
      pendingNudges: data.pendingNudges.map((item) => ({
        ...item,
        remain: formatRemain(item.deadlineAt - Date.now())
      }))
    })
    this.startTimer()
  },
  startTimer() {
    this.clearTimer()
    if (!this.data.pendingNudges.length) return
    this.timer = setInterval(() => {
      const pendingNudges = this.data.pendingNudges.map((item) => ({
        ...item,
        remain: formatRemain(item.deadlineAt - Date.now())
      }))
      this.setData({ pendingNudges })
    }, 1000) as unknown as number
  },
  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = 0
    }
  },
  onCreate() {
    wx.navigateTo({ url: '/pages/plan-create/plan-create' })
  },
  onOpenPlan(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    wx.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${e.detail.id}` })
  },
  onOpenNudge(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/nudge/nudge?id=${id}` })
  }
})
