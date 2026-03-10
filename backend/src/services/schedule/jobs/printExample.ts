import { Agenda, Job } from 'agenda'

import log from '../../log.js'

interface PrintJobData {
  info: string
}

export const PRINT_JOB_NAME = 'print-example'

export function registerPrintJob(agenda: Agenda): void {
  agenda.define<PrintJobData>(PRINT_JOB_NAME, async (job: Job<PrintJobData>) => {
    const { info } = job.attrs.data ?? {}
    log.info(`%%%%%%%%%%%%%%%%%%%%%%%% - Print Job: ${info}`)
  })
}

export async function testKickOffAnotherJob(agenda: Agenda) {
  await agenda.schedule(
    'in 30 seconds', // Interval to run
    'print-example', // Job to run
    { info: 'This will run in 30 seconds' }, // Parameters we want to supply to the job
  )
}
