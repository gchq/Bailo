const { suite } = require('uvu')
const t = require('uvu/assert')

const { PMongoQueue } = require('../dist/pMongoQueue')
const { getClient } = require('./setup')
const { pause } = require('./util')

const Delay = suite('Delay')

Delay.before(async (context) => {
  Object.assign(context, await getClient('delay'))
})

Delay('Check reappears', async ({ db }) => {
  const queue = new PMongoQueue(db, 'delay', { delay: 0.1 })
  t.ok(queue, 'Queue created ok')

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Got id receipt of message')

  let msg

  msg = await queue.get()
  t.ok(!msg, 'No msg received')

  await pause(150)

  msg = await queue.get()
  t.ok(msg.id, 'Got a message after delay')

  await queue.ack(msg.ack)

  msg = await queue.get()
  t.ok(!msg, 'No more messages')
})

Delay('Check individual message overrides', async ({ db }) => {
  const queue = new PMongoQueue(db, 'delay', { delay: 0.1 })
  t.ok(queue, 'Queue created ok')

  await queue.add('Hello, World!', { delay: 0.2 })

  let msg

  msg = await queue.get()
  t.ok(!msg, 'Got no message')
  await pause(150)

  msg = await queue.get()
  t.ok(!msg, 'Got no message')
  await pause(150)

  msg = await queue.get()
  t.ok(msg.id, 'Got a message')
})

Delay.after(async ({ client }) => {
  await client.close()
})

Delay.run()
