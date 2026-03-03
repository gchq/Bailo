import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'

import { getConnectionURI } from '../../utils/database.js'
import log from '../log.js'
import { PRINT_JOB_NAME, registerPrintJob } from './jobs/printExample.js'

let agenda: Agenda

export function getAgenda(): Agenda {
  if (!agenda) {
    throw new Error('Agenda has not been initialised')
  }
  return agenda
}

export async function startScheduler(): Promise<Agenda> {
  agenda = new Agenda({
    backend: new MongoBackend({
      address: getConnectionURI(),
    }),
  })

  // Register all jobs here
  registerPrintJob(agenda)

  log.info('Starting up scheduler...')
  await agenda.start()

  // Initiate any jobs here

  // Example - Running a job every 1 minute
  await agenda.every(
    '1 minute', // Interval to run
    PRINT_JOB_NAME, // Job to run
    { info: 'This will run every 1 minute' }, // Parameters we want to supply to the job
    {
      // Additional options
      skipImmediate: true, // Skip the immediate first run
    },
  )

  // Example - Running a one-off job at a future time - 3rd March 2026 at 09:25am
  await agenda.schedule(new Date('2026-03-03T09:25:00Z'), PRINT_JOB_NAME, {
    info: 'This will run on the 3rd March 2026 at 09:25am',
  })

  return agenda
}
