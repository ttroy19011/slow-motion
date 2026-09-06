export type PlanMemberRole = 'owner' | 'doer' | 'watcher'
export type NudgeStatus = 'pending' | 'done' | 'delayed' | 'expired'
export type DelayKey = '1h' | 'tonight' | 'tomorrow'

export interface UserProfile {
  _id?: string
  openid: string
  nickName: string
  avatarUrl: string
  createdAt: number
}

export interface PlanStage {
  id: string
  title: string
  targetDays: number
  order: number
  completed: boolean
}

export interface Plan {
  _id: string
  title: string
  description: string
  frequency: 'daily'
  dailyTargetMinutes: number
  stages: PlanStage[]
  streak: number
  totalDays: number
  totalMinutes: number
  lastCheckinDate: string
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface PlanMember {
  _id?: string
  planId: string
  openid: string
  role: PlanMemberRole
  nickName?: string
  avatarUrl?: string
  createdAt: number
}

export interface Nudge {
  _id: string
  planId: string
  planTitle: string
  fromOpenid: string
  fromName: string
  toOpenid: string
  status: NudgeStatus
  deadlineAt: number
  delayTo?: number
  delayLabel?: string
  responseAt?: number
  createdAt: number
}

export interface HomeData {
  user: UserProfile
  plans: Plan[]
  pendingNudges: Nudge[]
  cloudReady: boolean
}

export interface PlanDetailData {
  plan: Plan
  members: PlanMember[]
  myRoles: PlanMemberRole[]
  todayChecked: boolean
  pendingNudge?: Nudge
  latestNudge?: Nudge
}

export interface SocialData {
  watching: Plan[]
  myPlans: Array<Plan & { watchers: PlanMember[] }>
}

export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiFail {
  ok: false
  error: string
}
