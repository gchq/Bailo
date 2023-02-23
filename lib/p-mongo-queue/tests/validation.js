const { suite } = require('uvu')
const t = require('uvu/assert')
const { EventEmitter } = require('events')

const { PMongoQueue } = require('../dist/pMongoQueue')
const { getClient } = require('./setup')

const Validation = suite('Validation')

Validation.before(async (context) => {
  Object.assign(context, await getClient('validation'))
})

Validation('Must provide db', async () => {
  t.throws(() => new PMongoQueue(), /.*provide a mongodb.*/)
})

Validation('Must not provide event emitter', async () => {
  class Emitter extends EventEmitter {}
  t.throws(() => new PMongoQueue(new Emitter()), /.*provide a mongodb.*/)
})

Validation('Must not provide event emitter', async ({ db }) => {
  t.throws(() => new PMongoQueue(db), /.*provide a queue name.*/)
})

Validation.after(async ({ client }) => {
  await client.close()
})

Validation.run()
