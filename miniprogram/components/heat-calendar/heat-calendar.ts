import { buildHeatmap } from '../../utils/date'

Component({
  properties: {
    checkinCounts: {
      type: Object,
      value: {}
    }
  },
  data: {
    weeks: [] as Array<{ days: Array<{ date: string; count: number; level: number }> }>,
    monthLabels: [] as string[],
    activeDays: 0,
    tip: ''
  },
  observers: {
    checkinCounts(counts: Record<string, number>) {
      const heat = buildHeatmap(counts || {}, 17)
      this.setData({
        weeks: heat.weeks,
        monthLabels: heat.monthLabels,
        activeDays: heat.totalDays,
        tip: ''
      })
    }
  },
  methods: {
    onDayTap(e: WechatMiniprogram.TouchEvent) {
      const { date, count } = e.currentTarget.dataset as { date: string; count: number }
      if (!date) return
      const tip = count > 0 ? `${date}：完成 ${count} 次` : `${date}：未打卡`
      this.setData({ tip })
    }
  }
})
