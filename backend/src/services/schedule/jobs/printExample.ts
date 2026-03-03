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
