import { api, withBusy } from '../../services/api'
import { displayName, nudgeStatusText } from '../../utils/format'
import type { PlanDetailData, PlanMemberRole } from '../../types/index'

function roleText(roles: PlanMemberRole[]): string {
  if (roles.includes('doer') && roles.includes('owner')) return '我是制定者，也是执行者'
  if (roles.includes('doer')) return '我是执行者'
  if (roles.includes('watcher')) return '我在关注这份计划'
  if (roles.includes('owner')) return '我制定了这份计划'
  return ''
}

Page({
  data: {
    planId: '',
    loading: true,
    detail: null as PlanDetailData | null,
    roleText: '',
    canCheckin: false,
    canNudge: false,
    canFollow: false,
    watcherNames: '',
    latestNudgeText: ''
  },
  onLoad(query: Record<string, string | undefined>) {
    const planId = query.id || ''
    this.setData({ planId })
    if (!planId) {
      wx.showToast({ title: '计划不存在', icon: 'none' })
      return
    }
  },
  onShow() {
    if (this.data.planId) this.load()
  },
  async load() {
    const detail = await withBusy('加载中', () => api.getPlan(this.data.planId))
    if (!detail) {
      this.setData({ loading: false })
      return
    }
    const roles = detail.myRoles || []
    const watchers = detail.members.filter((m) => m.role === 'watcher')
    this.setData({
      loading: false,
      detail,
      roleText: roleText(roles),
      canCheckin: roles.includes('doer'),
      canNudge: roles.includes('watcher') && !roles.includes('doer'),
      canFollow: roles.length === 0,
      watcherNames: watchers.length
        ? watchers.map((m) => displayName(m.nickName)).join('、')
        : '还没有亲友关注',
      latestNudgeText: detail.latestNudge
        ? nudgeStatusText(detail.latestNudge.status, detail.latestNudge.delayLabel)
        : ''
    })
  },
  async onCheckin() {
    const plan = await withBusy('记录中', () => api.checkin(this.data.planId))
    if (!plan) return
    wx.showToast({ title: '今日已记录', icon: 'success' })
    this.load()
  },
  async onFollow() {
    const detail = await withBusy('关注中', () => api.followPlan(this.data.planId))
    if (!detail) return
    wx.showToast({ title: '已关注', icon: 'success' })
    this.load()
  },
  async onNudge() {
    const nudge = await withBusy('发送中', () => api.sendNudge(this.data.planId))
    if (!nudge) return
    wx.showToast({ title: '已督促', icon: 'success' })
  },
  onShareAppMessage() {
    const plan = this.data.detail?.plan
    return {
      title: plan ? `邀请你关注「${plan.title}」` : '邀请你关注一份慢系统计划',
      path: `/pages/plan-detail/plan-detail?id=${this.data.planId}`
    }
  }
})
