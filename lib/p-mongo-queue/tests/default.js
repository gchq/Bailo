const { suite } = require('uvu')
const t = require('uvu/assert')

const PMongoQueue = require('../pMongoQueue')
const { getClient } = require('./setup')

const Default = suite('Default')

Default.before(async (context) => {
  Object.assign(context, await getClient('default'))
})

Default('Can create instance', async ({ db }) => {
  const queue = new PMongoQueue(db, 'default')
  t.ok(queue, 'Queue created ok')
})

Default('Single round trip', async ({ db }) => {
  const queue = new PMongoQueue(db, 'default')

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id for this message')

  const msg = await queue.get()
  t.ok(msg.id, 'Got a msg.id')
  t.equal(typeof msg.id, 'string', 'msg.id is a string')
  t.ok(msg.ack, 'Got a msg.ack')
  t.equal(typeof msg.ack, 'string', 'msg.ack is a string')
  t.ok(msg.tries, 'Got a msg.tries')
  t.equal(typeof msg.tries, 'number', 'msg.tries is a number')
  t.equal(msg.tries, 1, 'msg.tries is currently one')
  t.equal(msg.payload, 'Hello, World!', 'Payload is correct')

  const ackId = await queue.ack(msg.ack)
  t.ok(ackId, 'Received an id when acking this message')
})

Default('Single roudn trip, no re-ack', async ({ db }) => {
  const queue = new PMongoQueue(db, 'default')

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id for this message')

  const msg = await queue.get()
  t.ok(msg.id, 'Got a msg.id')
  t.equal(typeof msg.id, 'string', 'msg.id is a string')
  t.ok(msg.ack, 'Got a msg.ack')
  t.equal(typeof msg.ack, 'string', 'msg.ack is a string')
  t.ok(msg.tries, 'Got a msg.tries')
  t.equal(typeof msg.tries, 'number', 'msg.tries is a number')
  t.equal(msg.tries, 1, 'msg.tries is currently one')
  t.equal(msg.payload, 'Hello, World!', 'Payload is correct')

  const ackId = await queue.ack(msg.ack)
  t.ok(ackId, 'Received an id when acking this message')

  try {
    const id = await queue.ack(msg.ack)
    t.fail('Should receive an error when acking twice')
  } catch (e) {}
})

Default.after(async ({ client }) => {
  await client.close()
})

Default.run()
