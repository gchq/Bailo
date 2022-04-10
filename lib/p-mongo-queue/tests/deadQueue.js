const { suite } = require('uvu')
const t = require('uvu/assert')

const PMongoQueue = require('../pMongoQueue')
const { getClient } = require('./setup')
const { pause } = require('./util')

const DeadQueue = suite('DeadQueue')

DeadQueue.before(async (context) => {
  Object.assign(context, await getClient('dead-queue'))
  try {
    await context.db.collection('queue').drop()
  } catch (e) {}
})

DeadQueue('Can create queue', async ({ db }) => {
  const queue = new PMongoQueue(db, 'queue', { visibility: 1, deadQueue: 'dead-queue' })
  t.ok(queue, 'Queue created ok')
})

DeadQueue('Default dead queue limit', async ({ db }) => {
  const deadQueue = new PMongoQueue(db, 'dead-queue')
  const queue = new PMongoQueue(db, 'queue', { visibility: 0.1, deadQueue })

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id for this message')

  let msg

  // first
  msg = await queue.get()
  t.ok(msg, 'Should get message')
  await pause(150)

  // second
  msg = await queue.get()
  t.ok(msg, 'Should get message')
  await pause(150)

  // third
  msg = await queue.get()
  t.ok(msg, 'Should get message')
  await pause(150)

  // fourth
  msg = await queue.get()
  t.ok(msg, 'Should get message')
  await pause(150)

  // fifth
  msg = await queue.get()
  t.ok(msg, 'Should get message')
  await pause(150)

  // sixth
  msg = await queue.get()
  t.equal(msg, undefined)

  // dead queue
  msg = await deadQueue.get()
  t.ok(msg.id, 'Got a message id from the deadQueue')
  t.equal(msg.payload.id, id, 'Got the same message id as the original message')
  t.equal(msg.payload.payload, 'Hello, World!', 'Got the same as the original message')
  t.equal(msg.payload.tries, 6, 'Got the tries as 6')
})

DeadQueue.after(async ({ client }) => {
  await client.close()
})

DeadQueue.run()
