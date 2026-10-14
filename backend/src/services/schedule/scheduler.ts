import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'
import humanInterval from 'human-interval'

import config from '../../utils/config.js'
import { getConnectionURI } from '../../utils/database.js'
import log from '../log.js'
import { notifyLifeCycleReview } from '../smtp/smtp.js'

export type JobRegistrar = (agenda: Agenda) => Promise<void> | void

export type LifecycleReviewJobData = {
  modelId: string
  reviewId: string
  dueIn?: string
}

export const LIFECYCLE_REVIEW_EMAIL_JOB = 'sendLifeCycleReviewEmail'

let agenda: Agenda | undefined
let started = false

function getOrCreateAgenda(): Agenda {
  if (!agenda) {
    log.info('Scheduler initialising...')
    agenda = new Agenda({
      backend: new MongoBackend({
        address: getConnectionURI(),
      }),
    })
  }
  return agenda
}

export async function startScheduler(jobRegistrars: JobRegistrar[] = []) {
  if (started) {
    return getOrCreateAgenda()
  }

  const instance = getOrCreateAgenda()

  log.info('Scheduler starting up...')

  instance.on('error', (err) => {
    log.error({ err }, 'Agenda error')
  })

  try {
    await instance.start()
    started = true
    log.info('Scheduler started')
  } catch (err) {
    log.error({ err }, 'Failed to start the scheduler')
    throw err
  }

  // Assign jobs after agenda has started so that they can use `getScheduler`
  await Promise.all(jobRegistrars.map((registerJob) => registerJob(instance)))

  return instance
}

export function registerLifecycleReviewJob(agenda: Agenda) {
  agenda.define<LifecycleReviewJobData>(LIFECYCLE_REVIEW_EMAIL_JOB, async (job) => {
    const { modelId, reviewId, dueIn } = job.attrs.data
    await notifyLifeCycleReview(modelId, reviewId, dueIn)
  })
}

export async function cancelLifecycleReviewJobs(modelId: string, reviewId: string) {
  const scheduler = getScheduler()
  await scheduler.cancel({ name: LIFECYCLE_REVIEW_EMAIL_JOB, data: { modelId, reviewId } })
}

export async function cancelLifecycleJobsForModel(modelId: string) {
  const scheduler = getScheduler()
  await scheduler.cancel({ name: LIFECYCLE_REVIEW_EMAIL_JOB, data: { modelId } })
}

export async function scheduleLifeCycleReviewEmails(modelId: string, reviewId: string, dueDate: Date) {
  const scheduler = getScheduler()
  const preReminderIntervals = config.smtp.lifecycle.preReminderIntervals

  const now = new Date()
  for (const dueIn of preReminderIntervals) {
    const interval = humanInterval(dueIn)
    if (!interval) {
      log.warn({ dueIn }, 'The time interval provided could not be converted to a numerical value.')
      continue
    }
    const dueTimeStamp = new Date(dueDate.getTime() - interval)
    if (dueTimeStamp > now) {
      await scheduler.schedule(dueTimeStamp, LIFECYCLE_REVIEW_EMAIL_JOB, { modelId, reviewId, dueIn })
    }
  }

  const interval = humanInterval(config.smtp.lifecycle.postReminderInterval)
  if (interval) {
    await scheduler.every(
      config.smtp.lifecycle.postReminderInterval,
      LIFECYCLE_REVIEW_EMAIL_JOB,
      { modelId, reviewId },
      { startDate: new Date(dueDate) },
    )
  } else {
    log.warn(
      { reminderInterval: config.smtp.lifecycle.postReminderInterval },
      'The time interval provided could not be converted to a numerical value.',
    )
  }
}

export function getScheduler(): Agenda {
  if (!started || !agenda) {
    throw new Error('Scheduler has not been started')
  }
  return agenda
}
