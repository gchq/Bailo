import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'

import { getConnectionURI } from '../../utils/database.js'
import log from '../log.js'

export type JobRegistrar = (agenda: Agenda) => Promise<void> | void

let agenda: Agenda | null = null

export function getScheduler(): Agenda {
  if (!agenda) {
    throw new Error('The scheduler has not been initialised')
  }
  return agenda
}

export async function startScheduler(jobRegistrars: JobRegistrar[] = []): Promise<Agenda> {
  if (agenda) {
    return agenda
  }

  log.info('Initialising scheduler...')

  agenda = new Agenda({
    backend: new MongoBackend({
      address: getConnectionURI(),
    }),
  })

  agenda.on('error', (err) => {
    log.error({ err }, 'Agenda error')
  })

  // Register jobs
  for (const registerJob of jobRegistrars) {
    await registerJob(agenda)
  }

  await agenda.start()
  log.info('Scheduler started')

  return agenda
}
