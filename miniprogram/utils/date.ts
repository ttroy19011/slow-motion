export function todayLabel(ts = Date.now()): string {
  const d = new Date(ts)
  const week = '日一二三四五六'[d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatRemain(ms: number): string {
  if (ms <= 0) return '00:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
}

export function formatClock(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function delayOptions(now = Date.now()): Array<{ key: string; label: string; at: number }> {
  const hour = 3600 * 1000
  const tonight = new Date(now)
  tonight.setHours(20, 0, 0, 0)
  let tonightTs = tonight.getTime()
  if (tonightTs <= now) tonightTs += 24 * hour
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return [
    { key: '1h', label: '1 小时后', at: now + hour },
    { key: 'tonight', label: '今晚 20:00', at: tonightTs },
    { key: 'tomorrow', label: '明天 09:00', at: tomorrow.getTime() }
  ]
}

/** 东八区 YYYY-MM-DD */
export function dateKeyCST(ts = Date.now()): string {
  return new Date(ts + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export interface HeatDay {
  date: string
  count: number
  level: number
  monthLabel: string
}

export interface HeatWeek {
  days: HeatDay[]
}

/** 近 weeks 周的 GitHub 风格热力数据（列=周，行=日） */
export function buildHeatmap(
  checkinCounts: Record<string, number> = {},
  weeks = 17,
  now = Date.now()
): { weeks: HeatWeek[]; totalDays: number; monthLabels: string[] } {
  const todayKey = dateKeyCST(now)
  const todayStart = Date.parse(`${todayKey}T00:00:00.000+08:00`)
  const weekday = new Date(todayStart + 8 * 60 * 60 * 1000).getUTCDay()
  const start = todayStart - ((weeks - 1) * 7 + weekday) * 86400000

  const counts = Object.values(checkinCounts)
  const max = Math.max(1, ...counts)
  const result: HeatWeek[] = []
  let totalDays = 0
  const monthLabels: string[] = []

  for (let w = 0; w < weeks; w += 1) {
    const days: HeatDay[] = []
    for (let d = 0; d < 7; d += 1) {
      const ts = start + (w * 7 + d) * 86400000
      const date = dateKeyCST(ts)
      const count = checkinCounts[date] || 0
      if (count > 0) totalDays += 1
      let level = 0
      if (count > 0) {
        const ratio = count / max
        if (ratio <= 0.25) level = 1
        else if (ratio <= 0.5) level = 2
        else if (ratio <= 0.75) level = 3
        else level = 4
      }
      const month = Number(date.slice(5, 7))
      const day = Number(date.slice(8, 10))
      days.push({
        date,
        count,
        level,
        monthLabel: day === 1 ? `${month}月` : ''
      })
    }
    result.push({ days })
    const firstOfMonth = days.find((item) => item.monthLabel)
    monthLabels.push(firstOfMonth ? firstOfMonth.monthLabel : '')
  }

  return { weeks: result, totalDays, monthLabels }
}
