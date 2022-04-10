import { suite } from 'uvu'
import { EventEmitter } from 'events'
import * as t from 'uvu/assert'

import mongodbQueue from '../mongodb-queue.js'
import { getClient } from './setup.js'

const Validation = suite('Validation')

Validation.before(async (context) => {
  Object.assign(context, await getClient('validation'))
})

Validation('Must provide db', async ({ db }) => {
  t.throws(() => mongodbQueue(), /.*provide a mongodb.*/)
})

Validation('Must not provide event emitter', async ({ db }) => {
  class Emitter extends EventEmitter {}
  t.throws(() => mongodbQueue(new Emitter()), /.*provide a mongodb.*/)
})

Validation('Must not provide event emitter', async ({ db }) => {
  t.throws(() => mongodbQueue(db), /.*provide a queue name.*/)
})

Validation.after(async ({ client }) => {
  await client.close()
})

Validation.run()
