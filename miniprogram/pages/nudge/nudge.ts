import { api, withBusy } from '../../services/api'
import { delayOptions, formatClock, formatRemain } from '../../utils/date'
import type { Nudge } from '../../types/index'

Page({
  data: {
    nudgeId: '',
    nudge: null as Nudge | null,
    remain: '',
    expired: false,
    delays: delayOptions(),
    chosen: '1h'
  },
  timer: 0 as number,
  onLoad(query: Record<string, string | undefined>) {
    this.setData({ nudgeId: query.id || '' })
  },
  onShow() {
    this.load()
  },
  onUnload() {
    this.clearTimer()
  },
  async load() {
    const nudge = await withBusy('加载中', () => api.getNudge(this.data.nudgeId))
    if (!nudge) return
    if (nudge.status !== 'pending') {
      wx.showToast({ title: '这条督促已结束', icon: 'none' })
      setTimeout(() => wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/home' }) }), 800)
      return
    }
    this.setData({ nudge, delays: delayOptions() })
    this.tick()
    this.startTimer()
  },
  startTimer() {
    this.clearTimer()
    this.timer = setInterval(() => this.tick(), 1000) as unknown as number
  },
  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = 0
    }
  },
  tick() {
    const nudge = this.data.nudge
    if (!nudge) return
    const left = nudge.deadlineAt - Date.now()
    this.setData({
      remain: formatRemain(left),
      expired: left <= 0
    })
  },
  onChoose(e: WechatMiniprogram.TouchEvent) {
    this.setData({ chosen: e.currentTarget.dataset.key as string })
  },
  async onDone() {
    const res = await withBusy('记录中', () => api.respondNudge(this.data.nudgeId, 'done'))
    if (!res) return
    wx.showToast({ title: '已完成', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 400)
  },
  async onDelay() {
    const option = this.data.delays.find((item) => item.key === this.data.chosen)
    if (!option) return
    const res = await withBusy('提交中', () =>
      api.respondNudge(this.data.nudgeId, 'delay', {
        delayTo: option.at,
        delayLabel: option.label
      })
    )
    if (!res) return
    wx.showToast({ title: `已延迟到 ${formatClock(option.at)}`, icon: 'none' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
