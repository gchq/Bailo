import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'

import { getConnectionURI } from '../../utils/database.js'
import log from '../log.js'

export type JobRegistrar = (agenda: Agenda) => Promise<void> | void

let agenda: Agenda | null = null
let started = false

export function getScheduler(): Agenda {
  if (!agenda) {
    throw new Error('The scheduler has not been initialised')
  }
  return agenda
}

export async function startScheduler(jobRegistrars: JobRegistrar[] = []): Promise<Agenda> {
  // If agenda exists and has already been started
  if (agenda && started) {
    return agenda
  }

  // If agenda has not been initialised
  if (!agenda) {
    log.info('Initialising scheduler...')

    agenda = new Agenda({
      backend: new MongoBackend({
        address: getConnectionURI(),
      }),
    })

    agenda.on('error', (err) => {
      log.error({ err }, 'Agenda error')
    })

    log.info('Registering scheduler jobs...')
    for (const registerJob of jobRegistrars) {
      await registerJob(agenda)
    }
  }

  // If agenda has been initialised but not started
  try {
    await agenda.start()
    started = true
    log.info('Scheduler started')
  } catch (err) {
    log.fatal({ err }, 'Failed to start scheduler')
  }

  return agenda
}
