const { suite } = require('uvu')
const t = require('uvu/assert')

const { PMongoQueue } = require('../dist/pMongoQueue')
const { getClient } = require('./setup')

const Many = suite('Many')

Many.before(async (context) => {
  Object.assign(context, await getClient('many'))
})

const total = 250

Many('Can push many messages at once', async ({ db }) => {
  const queue = new PMongoQueue(db, 'many')

  const messages = new Array(total).fill(null).map((i) => `no=${i}`)
  await queue.add(messages)

  const receivedMessages = []
  for (let i = 0; i < 250; i++) {
    const msg = await queue.get()
    if (!msg) t.fail('Failed getting enough messages')

    receivedMessages.push(msg)
  }

  if (receivedMessages.length !== messages.length) {
    t.fail('Failed to get same messages back')
  }

  await Promise.all(receivedMessages.map((message) => queue.ack(message.ack)))
})

Many('Can push many messages at once', async ({ db }) => {
  const queue = new PMongoQueue(db, 'many')

  try {
    await queue.add([])
    t.fail('Should error on receiving no items')
  } catch (e) {}
})

Many.after(async ({ client }) => {
  await client.close()
})

Many.run()
