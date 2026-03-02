// services/schedule/jobs/sendEmail.ts
// import { Agenda, Job } from 'agenda'

// interface deleteExpiredFilesJobData {
//   to: string
//   subject: string
//   body: string
// }

// export const deleteExpiredFilesJob = (agenda: Agenda): void => {
//   agenda.define<deleteExpiredFilesJobData>('send-email', async (job: Job<deleteExpiredFilesJobData>) => {
//     // const { to, subject, body } = job.attrs.data!

//     // Placeholder: replace with real email service
//     // console.log(`Sending email to ${to}`)
//     // console.log(`Subject: ${subject}`)
//     // console.log(`Body: ${body}`)

//     // Example error handling
//     try {
//       // await emailClient.send(...)
//     } catch (err) {
//       // console.error('Failed to send email', err)
//       throw err // allows Agenda retries if configured
//     }
//   })
// }
