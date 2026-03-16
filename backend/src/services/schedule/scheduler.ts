import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'

import { getConnectionURI } from '../../utils/database.js'
import log from '../log.js'

export type JobRegistrar = (agenda: Agenda) => Promise<void> | void

log.info('Scheduler initialising...')
const agenda = new Agenda({
  backend: new MongoBackend({
    address: getConnectionURI(),
  }),
})

let started = false

export async function startScheduler(jobRegistrars: JobRegistrar[] = []) {
  if (started) {
    return agenda
  }

  log.info('Scheduler starting up...')

  agenda.on('error', (err) => {
    log.error({ err }, 'Agenda error')
  })

  for (const registerJob of jobRegistrars) {
    await registerJob(agenda)
  }

  try {
    await agenda.start()
    started = true
    log.info('Scheduler started')
  } catch (err) {
    log.error({ err }, 'Failed to start the scheduler')
  }

  return agenda
}

export function getScheduler(): Agenda {
  if (!started) {
    throw new Error('Scheduler has not been started')
  }
  return agenda
}
