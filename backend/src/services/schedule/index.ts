// // services/schedule/index.ts
// import { defineSendEmailJob } from './jobs/sendEmail'
// import { agenda } from './scheduler'

// const startScheduler = async (): Promise<void> => {
//   defineSendEmailJob(agenda)

//   await agenda.start()
//   console.log('Agenda started')
// }

// startScheduler().catch((err) => {
//   console.error('Failed to start scheduler', err)
//   process.exit(1)
// })
