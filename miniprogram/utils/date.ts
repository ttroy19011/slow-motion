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
