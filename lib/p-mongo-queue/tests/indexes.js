import { suite } from 'uvu'
import * as t from 'uvu/assert'

import mongodbQueue from '../mongodb-queue.js'
import { getClient } from './setup.js'

const Indexes = suite('Indexes')

Indexes.before(async (context) => {
  Object.assign(context, await getClient('indexes'))
})

Indexes('Check deleted messages are deleted', async ({ db }) => {
  const queue = mongodbQueue(db, 'indexes')

  const indexName = await queue.createIndexes()
  t.ok(indexName, 'Received index name')
})

Indexes.after(async ({ client }) => {
  await client.close()
})

Indexes.run()
