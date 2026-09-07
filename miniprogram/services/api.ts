import type {
  HomeData,
  Plan,
  PlanDetailData,
  ProfileData,
  SocialData,
  UserProfile,
  Nudge
} from '../types/index'

async function callApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await wx.cloud.callFunction({
    name: 'api',
    data: { action, ...payload }
  })
  const result = res.result as { ok?: boolean; data?: T; error?: string }
  if (!result || result.ok !== true) {
    throw new Error(result?.error || '服务暂时不可用，请检查云开发是否已开通')
  }
  return result.data as T
}

export const api = {
  login: () => callApi<UserProfile>('login'),
  updateProfile: (nickName: string, avatarUrl: string) =>
    callApi<UserProfile>('updateProfile', { nickName, avatarUrl }),
  getHome: () => callApi<HomeData>('getHome'),
  getProfile: () => callApi<ProfileData>('getProfile'),
  createPlan: (payload: {
    title: string
    description: string
    dailyTargetMinutes: number
    stageTitle: string
    stageTargetDays: number
  }) => callApi<Plan>('createPlan', payload),
  getPlan: (planId: string) => callApi<PlanDetailData>('getPlan', { planId }),
  checkin: (planId: string, minutes?: number) =>
    callApi<Plan>('checkin', { planId, minutes }),
  followPlan: (planId: string) => callApi<PlanDetailData>('followPlan', { planId }),
  getNudge: (nudgeId: string) => callApi<Nudge>('getNudge', { nudgeId }),
  sendNudge: (planId: string) => callApi<Nudge>('sendNudge', { planId }),
  respondNudge: (nudgeId: string, action: 'done' | 'delay', extra?: { delayTo?: number; delayLabel?: string }) =>
    callApi<Nudge>('respondNudge', { nudgeId, respondAction: action, ...extra }),
  getSocial: () => callApi<SocialData>('getSocial')
}

export async function withBusy<T>(title: string, task: () => Promise<T>): Promise<T | undefined> {
  wx.showLoading({ title, mask: true })
  try {
    return await task()
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    wx.showToast({ title: message, icon: 'none', duration: 2500 })
    return undefined
  } finally {
    wx.hideLoading()
  }
}
