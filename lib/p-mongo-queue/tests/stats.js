import { suite } from 'uvu'
import * as t from 'uvu/assert'

import mongodbQueue from '../mongodb-queue.js'
import { getClient } from './setup.js'

const Stats = suite('Stats')

Stats.before(async (context) => {
  Object.assign(context, await getClient('stats'))
})

Stats('Stats for a single message add, receive and ack', async ({ db }) => {
  const queue = mongodbQueue(db, 'stats')

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id')

  t.equal(await queue.total(), 1)
  t.equal(await queue.size(), 1)
  t.equal(await queue.inFlight(), 0)
  t.equal(await queue.done(), 0)

  const msg = await queue.get()

  t.equal(await queue.total(), 1)
  t.equal(await queue.size(), 0)
  t.equal(await queue.inFlight(), 1)
  t.equal(await queue.done(), 0)

  await queue.ack(msg.ack)

  t.equal(await queue.total(), 1)
  t.equal(await queue.size(), 0)
  t.equal(await queue.inFlight(), 0)
  t.equal(await queue.done(), 1)
})

Stats.after(async ({ client }) => {
  await client.close()
})

Stats.run()
