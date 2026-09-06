import type { Plan } from '../../types/index'
import { currentStageTitle, formatDuration } from '../../utils/format'

Component({
  properties: {
    plan: {
      type: Object,
      value: {}
    },
    extra: {
      type: String,
      value: ''
    }
  },
  data: {
    durationText: '',
    stageTitle: ''
  },
  observers: {
    plan(plan: Plan) {
      if (!plan || !plan.title) return
      this.setData({
        durationText: formatDuration(plan.totalMinutes || 0),
        stageTitle: currentStageTitle(plan)
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
