import type { Plan, PlanLifecycle } from '../types/index'

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} 小时 ${rest} 分钟` : `${h} 小时`
}

export function currentStage(plan: Plan): Plan['stages'][number] | undefined {
  const stages = plan.stages || []
  return stages.find((item) => !item.completed) || stages[stages.length - 1]
}

export function currentStageTitle(plan: Plan): string {
  const stage = currentStage(plan)
  return stage ? stage.title : ''
}

export function displayName(name?: string): string {
  const text = (name || '').trim()
  return text || '未命名亲友'
}

export function nudgeStatusText(status: string, delayLabel?: string): string {
  if (status === 'pending') return '等待 30 分钟内回应'
  if (status === 'done') return '已完成最小动作'
  if (status === 'delayed') return `已延迟：${delayLabel || '稍后'}`
  if (status === 'expired') return '超时未回应'
  return ''
}

export function planLifecycle(plan: Plan): PlanLifecycle {
  const stages = plan.stages || []
  if (stages.length > 0 && stages.every((item) => item.completed)) return 'done'
  if (!plan.totalDays && !plan.lastCheckinDate) return 'future'
  return 'active'
}

export function planStatusLabel(plan: Plan): string {
  const status = planLifecycle(plan)
  if (status === 'done') return '已完成'
  if (status === 'future') return '尚未开始'
  return '进行中'
}
