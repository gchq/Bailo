import { beforeAll, describe, expect, test, vi } from 'vitest'

import {
  cancelLifecycleReviewJobs,
  getScheduler,
  LIFECYCLE_REVIEW_EMAIL_JOB,
  registerLifecycleReviewJob,
  scheduleLifeCycleReviewEmails,
  startScheduler,
} from '../../src/services/schedule/scheduler.js'
import { agendaMethods } from '../testUtils/setupAgendaMocks.js'

vi.mock('../../src/utils/database.js', () => ({
  getConnectionURI: () => 'mongodb://test',
}))

const logMock = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../src/services/log.js', () => ({
  default: logMock,
}))

vi.mock('../../src/services/smtp/smtp.js', () => ({
  notifyLifeCycleReview: vi.fn(),
}))

const configMock = vi.hoisted(() => ({
  smtp: {
    lifecycle: {
      preReminderIntervals: ['1 day', '2 weeks', '10 weeks'],
      postReminderInterval: '1 day',
    },
  },
}))
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('scheduler', () => {
  test('getScheduler throws if scheduler not started', () => {
    expect(() => getScheduler()).toThrow('Scheduler has not been started')
  })

  test('startScheduler initialises and starts agenda', async () => {
    const agenda = await startScheduler([registerLifecycleReviewJob])
    expect(agenda).toBeDefined()
    expect(agenda.start).toHaveBeenCalledOnce()
    expect(getScheduler()).toBe(agenda)
    expect(agendaMethods.define).toHaveBeenCalledWith(LIFECYCLE_REVIEW_EMAIL_JOB, expect.anything())
  })
})

const ELEVEN_WEEKS = 6_652_800_000

describe('scheduler > lifecycle jobs', () => {
  beforeAll(async () => {
    await startScheduler([registerLifecycleReviewJob])
  })

  const dueDate = new Date(Date.now() + ELEVEN_WEEKS)

  test('registerLifecycleReviewJob defines the lifecycle email job on the agenda', () => {
    const fakeAgenda = { define: vi.fn() } as any
    registerLifecycleReviewJob(fakeAgenda)
    expect(fakeAgenda.define).toHaveBeenCalledWith('sendLifeCycleReviewEmail', expect.anything())
  })

  test('cancelLifecycleReviewJobs cancels jobs matching the given model and review ids', async () => {
    await cancelLifecycleReviewJobs('model-1', 'review-1')
    expect(agendaMethods.cancel).toHaveBeenCalledWith({
      name: 'sendLifeCycleReviewEmail',
      data: { modelId: 'model-1', reviewId: 'review-1' },
    })
  })

  test('scheduleLifeCycleReviewEmails schedules pre-reminder emails for future reminder dates', async () => {
    await scheduleLifeCycleReviewEmails('model-1', 'review-1', dueDate)

    expect(agendaMethods.schedule).toHaveBeenCalledTimes(3)
    expect(agendaMethods.every).toHaveBeenCalledOnce()
    expect(agendaMethods.every).toHaveBeenCalledWith(
      '1 day',
      'sendLifeCycleReviewEmail',
      { modelId: 'model-1', reviewId: 'review-1' },
      { startDate: dueDate },
    )
  })

  test('scheduleLifeCycleReviewEmails skips pre-reminders whose scheduled time is already in the past', async () => {
    await scheduleLifeCycleReviewEmails('model-1', 'review-1', new Date())

    expect(agendaMethods.schedule).not.toHaveBeenCalled()
    expect(agendaMethods.every).toHaveBeenCalledOnce()
  })

  test('scheduleLifeCycleReviewEmails logs a warning for an unrecognised pre-reminder interval', async () => {
    vi.spyOn(configMock.smtp.lifecycle, 'preReminderIntervals', 'get').mockReturnValue(['1 lustrum', '1 nundine'])
    await scheduleLifeCycleReviewEmails('model-1', 'review-1', dueDate)

    expect(agendaMethods.schedule).not.toHaveBeenCalled()
    expect(logMock.warn).toHaveBeenCalled()
  })

  test('scheduleLifeCycleReviewEmails logs a warning for an unrecognised post-reminder interval', async () => {
    vi.spyOn(configMock.smtp.lifecycle, 'postReminderInterval', 'get').mockReturnValue('10 ghurries')
    await scheduleLifeCycleReviewEmails('model-1', 'review-1', dueDate)

    expect(agendaMethods.every).not.toHaveBeenCalled()
    expect(logMock.warn).toHaveBeenCalled()
  })
})
