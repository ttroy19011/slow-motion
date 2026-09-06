import { api, withBusy } from '../../services/api'

const MINUTE_OPTIONS = [15, 30, 45, 60]

Page({
  data: {
    title: '',
    description: '',
    dailyTargetMinutes: 30,
    minuteOptions: MINUTE_OPTIONS,
    stageTitle: '第一周第一阶段',
    stageTargetDays: 7
  },
  onTitle(e: WechatMiniprogram.Input) {
    this.setData({ title: e.detail.value })
  },
  onDesc(e: WechatMiniprogram.Input) {
    this.setData({ description: e.detail.value })
  },
  onStageTitle(e: WechatMiniprogram.Input) {
    this.setData({ stageTitle: e.detail.value })
  },
  onStageDays(e: WechatMiniprogram.Input) {
    this.setData({ stageTargetDays: Number(e.detail.value) || 7 })
  },
  onMinutes(e: WechatMiniprogram.TouchEvent) {
    this.setData({ dailyTargetMinutes: Number(e.currentTarget.dataset.m) })
  },
  async onSubmit() {
    const title = this.data.title.trim()
    if (!title) {
      wx.showToast({ title: '请填写计划名称', icon: 'none' })
      return
    }
    const plan = await withBusy('创建中', () =>
      api.createPlan({
        title,
        description: this.data.description.trim(),
        dailyTargetMinutes: this.data.dailyTargetMinutes,
        stageTitle: this.data.stageTitle.trim() || '第一周第一阶段',
        stageTargetDays: this.data.stageTargetDays || 7
      })
    )
    if (!plan) return
    wx.showToast({ title: '已创建', icon: 'success' })
    setTimeout(() => {
      wx.redirectTo({ url: `/pages/plan-detail/plan-detail?id=${plan._id}` })
    }, 400)
  }
})
