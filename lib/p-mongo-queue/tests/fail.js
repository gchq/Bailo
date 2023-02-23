const { suite } = require('uvu')
const t = require('uvu/assert')

const { PMongoQueue } = require('../dist/pMongoQueue')
const { getClient } = require('./setup')

const Fail = suite('Fail')

Fail.before(async (context) => {
  Object.assign(context, await getClient('fail'))
})

Fail('Check fail with invalid ack throws', async ({ db }) => {
  const queue = new PMongoQueue(db, 'fail')

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
