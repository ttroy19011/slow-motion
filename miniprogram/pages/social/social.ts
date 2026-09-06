import { api, withBusy } from '../../services/api'
import { displayName } from '../../utils/format'
import type { Plan, PlanMember } from '../../types/index'

interface MyPlanView extends Plan {
  watcherText: string
}

Page({
  data: {
    watching: [] as Plan[],
    myPlans: [] as MyPlanView[],
    emptyWatch: true,
    emptyMine: true
  },
  onShow() {
    this.load()
  },
  async load() {
    const data = await withBusy('加载中', () => api.getSocial())
    if (!data) return
    this.setData({
      watching: data.watching,
      emptyWatch: data.watching.length === 0,
      emptyMine: data.myPlans.length === 0,
      myPlans: data.myPlans.map((plan) => ({
        ...plan,
        watcherText: formatWatchers(plan.watchers)
      }))
    })
  },
  onOpen(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    wx.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${e.detail.id}` })
  }
})

function formatWatchers(watchers: PlanMember[]): string {
  if (!watchers || !watchers.length) return '还没有亲友关注'
  return `关注者：${watchers.map((item) => displayName(item.nickName)).join('、')}`
}
