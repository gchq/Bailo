/**
 * This file is for illustration purposes. To be removed when PR is no longer in draft.
 */
import { Agenda, Job } from 'agenda'

import log from '../../log.js'

interface PrintJobData {
  info: string
}

export const PRINT_JOB_NAME = 'print-example'

export function registerPrintJob(agenda: Agenda): void {
  agenda.define<PrintJobData>(PRINT_JOB_NAME, async (job: Job<PrintJobData>) => {
    const { info } = job.attrs.data ?? {}
    log.info(`Print Job: ${info}`)
  })
}

// This is just an example, to be removed
export async function kickOffScheduledJob(agenda: Agenda) {
  await agenda.schedule(
    PRINT_JOB_NAME, // Interval to run
    'print-example', // Job to run
    { info: 'This will run in 30 seconds' }, // Parameters we want to supply to the job
  )
}

// This is just an example, to be removed
export async function kickOffRecurringJob(agenda: Agenda) {
  await agenda.every(
    PRINT_JOB_NAME, // Interval to run
    'print-example', // Job to run
    { info: 'This will run every 1 minute' }, // Parameters we want to supply to the job
    {
      // Additional options
      skipImmediate: true, // Skip the immediate first run
    },
  )
}
