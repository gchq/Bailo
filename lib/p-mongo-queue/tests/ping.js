const { suite } = require('uvu')
const t = require('uvu/assert')

const { PMongoQueue } = require('../dist/pMongoQueue')
const { getClient } = require('./setup')

const pause = (time) => new Promise((resolve) => setTimeout(resolve, time))

const Ping = suite('Ping')

Ping.before(async (context) => {
  Object.assign(context, await getClient('ping'))
})

Ping('Check ping increases visibility', async ({ db }) => {
  const queue = new PMongoQueue(db, 'ping', { visibility: 0.1 })

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id')

  let msg

  msg = await queue.get()
  t.ok(msg.id, 'Got message id')

  await pause(50)

  const pingId = await queue.ping(msg.ack)
  t.ok(pingId, 'Received ping id')

  await pause(75)

  const ackId = await queue.ack(msg.ack)
  t.ok(ackId, 'Received an id whilst acking')

  msg = await queue.get()
  t.equal(msg, undefined)
})

Ping('Check an acked message cannot be pinged', async ({ db }) => {
  const queue = new PMongoQueue(db, 'ping', { visibility: 1 })

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id')

  let msg

  msg = await queue.get()
  t.ok(msg.id, 'Got message id')

  const ackId = await queue.ack(msg.ack)
  t.ok(ackId, 'Received an id whilst acking')

  try {
    const pingId = await queue.ping(msg.ack)
    t.fail(pingId, 'Cannot ping acked message')
  } catch (e) {}
})

Ping.after(async ({ client }) => {
  await client.close()
})

Ping.run()
