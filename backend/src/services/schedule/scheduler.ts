// // services/schedule/scheduler.ts
// import Agenda from 'agenda'

// const mongoConnectionString = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/agenda'

// export const agenda = new Agenda({
//   db: {
//     address: mongoConnectionString,
//     collection: 'agendaJobs',
//   },
//   processEvery: '30 seconds',
// })

// agenda.on('ready', () => {
//   console.log('Agenda connected to MongoDB')
// })

// agenda.on('error', (err) => {
//   console.error('Agenda connection error:', err)
// })

// ---------------------

// import { MongoBackend } from '@agendajs/mongo-backend'
// import { Agenda } from 'agenda'

// // Via connection string
// const agenda = new Agenda({
//   backend: new MongoBackend({ address: 'mongodb://localhost/agenda' }),
// })

// // Via existing MongoDB connection
// const agenda = new Agenda({
//   backend: new MongoBackend({ mongo: existingDb }),
// })

// ------------------

import { MongoBackend } from '@agendajs/mongo-backend'
import { Agenda } from 'agenda'

import { getConnectionURI } from '../../utils/database.js'

// export const agenda = new Agenda({
//   db: {
//     address: process.env.MONGO_URI,
//     collection: 'agendaJobs',
//   },
// })

// const mongoConnection = getConnectionURI()

// Via existing MongoDB connection
// const agenda = new Agenda({
//   backend: new MongoBackend({ mongo: mongoConnection }),
// })
const agenda = new Agenda({
  backend: new MongoBackend({ address: getConnectionURI() }),
})

// agenda.define('send email', async (job) => {
//   // job logic
// })

export async function startScheduler() {
  await agenda.start()
}
