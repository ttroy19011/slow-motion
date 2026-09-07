import type { Plan } from '../../types/index'
import { currentStageTitle, formatDuration, planStatusLabel } from '../../utils/format'

Component({
  properties: {
    plan: {
      type: Object,
      value: {}
    },
    extra: {
      type: String,
      value: ''
    },
    showStatus: {
      type: Boolean,
      value: false
    }
  },
  data: {
    durationText: '',
    stageTitle: '',
    statusText: ''
  },
  observers: {
    'plan, showStatus'(plan: Plan, showStatus: boolean) {
      if (!plan || !plan.title) return
      this.setData({
        durationText: formatDuration(plan.totalMinutes || 0),
        stageTitle: currentStageTitle(plan),
        statusText: showStatus ? planStatusLabel(plan) : ''
      })
    }
  },
  methods: {
    onOpen() {
      const plan = this.data.plan as Plan
      if (!plan._id) return
      this.triggerEvent('open', { id: plan._id })
    }
  }
})
