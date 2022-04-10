import { suite } from 'uvu'
import * as t from 'uvu/assert'

import mongodbQueue from '../mongodb-queue.js'
import { getClient } from './setup.js'

const pause = (time) => new Promise((resolve) => setTimeout(resolve, time))

const Fail = suite('Fail')

Fail.before(async (context) => {
  Object.assign(context, await getClient('fail'))
})

Fail('Check fail with invalid ack throws', async ({ db }) => {
  const queue = mongodbQueue(db, 'fail')

  try {
    await queue.fail('NOT_ACK')
    t.unreachable('Should not be successful ack')
  } catch (e) {
    t.instance(e, Error)
  }
})

Fail.after(async ({ client }) => {
  await client.close()
})

Fail.run()
