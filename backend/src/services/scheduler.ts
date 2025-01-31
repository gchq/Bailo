import { Pulse } from '@pulsecron/pulse'

import log from './log.js'
import { getModelByIdForReview } from './model.js'
import { createModelReviews } from './review.js'

const mongoConnectionString = 'mongodb://mongo:27017/pulse'

const pulse = new Pulse({
  db: { address: mongoConnectionString },
  defaultConcurrency: 4,
  maxConcurrency: 4,
  processEvery: '10 seconds',
  resumeOnRestart: true,
})

pulse.on('start', (job) => {
  log.info(`Job <${job.attrs.name}> starting`)
})
pulse.on('success', (job) => {
  log.info(`Job <${job.attrs.name}> succeeded`)
})
pulse.on('fail', (error, job) => {
  log.info(`Job <${job.attrs.name}> failed:`, error)
})

pulse.define('create model review', async (job) => {
  const { modelId } = job.attrs.data

  const model = await getModelByIdForReview(modelId)
  await createModelReviews(model)
})

export async function scheduleReview(modelId: string) {
  await pulse.start()
  await pulse.schedule('in 2 minutes', 'create model review', { modelId })
}
