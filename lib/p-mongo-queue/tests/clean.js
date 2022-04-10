const { suite } = require('uvu')
const t = require('uvu/assert')

const PMongoQueue = require('../pMongoQueue')
const { getClient } = require('./setup')

const Clean = suite('Clean')

Clean.before(async (context) => {
  Object.assign(context, await getClient('clean'))
})

Clean('Check deleted messages are deleted', async ({ db }) => {
  const queue = new PMongoQueue(db, 'clean', { visibility: 1 })

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 0)

  await queue.clean()

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 0)

  await queue.add('Hello, World!')

  t.equal(await queue.size(), 1)
  t.equal(await queue.total(), 1)

  const msg = await queue.get()
  t.ok(msg.id, 'Got a msg.id (sanity check)')

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 1)

  await queue.clean()

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 1)

  const id = await queue.ack(msg.ack)
  t.ok(id, 'Received an id when acking this message')

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 1)

  await queue.clean()

  t.equal(await queue.size(), 0)
  t.equal(await queue.total(), 0)
})

Clean.after(async context => {
  await context.client.close()
})

Clean.run()
