const { suite } = require('uvu')
const t = require('uvu/assert')

const PMongoQueue = require('../dist/pMongoQueue')
const { getClient } = require('./setup')

const Indexes = suite('Indexes')

Indexes.before(async (context) => {
  Object.assign(context, await getClient('indexes'))
})

Indexes('Check deleted messages are deleted', async ({ db }) => {
  const queue = new PMongoQueue(db, 'indexes')

  const indexName = await queue.createIndexes()
  t.ok(indexName, 'Received index name')
})

Indexes.after(async ({ client }) => {
  await client.close()
})

Indexes.run()
