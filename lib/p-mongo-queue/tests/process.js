const { suite } = require('uvu')
const t = require('uvu/assert')

const PMongoQueue = require('../pMongoQueue')
const { getClient } = require('./setup')
const { pause } = require('./util')

const Process = suite('Process')

Process.before(async (context) => {
  Object.assign(context, await getClient('process'))
  try {
    await context.db.collection('dead-queue').drop()
  } catch (e) {
    // no dead-queue to drop
  }
})

Process.after.each(async ({ db }) => {
  try {
    await db.collection('dead-queue').drop()
  } catch (e) {
    // no dead-queue to drop
  }
  try {
    await db.collection('process').drop()
  } catch (e) {
    // no process collection to drop
  }
})

Process('Check ability to check jobs', async ({ db }) => {
  const deadQueue = new PMongoQueue(db, 'dead-queue')
  const queue = new PMongoQueue(db, 'process', { deadQueue })

  let success = 0
  let error = 0
  let retrying = 0
  queue.on('succeeded', () => (success += 1))
  queue.on('retrying', () => (retrying += 1))
  queue.on('failed', () => (error += 1))

  const id = await queue.add('Hello, World!')
  t.ok(id, 'Received an id')

  queue.parallelism = 1
  queue.currentlyProcessing = 0
  queue.processor = () => {
    /* do nothing */
  }

  await queue._checkJobs()
  t.equal(success, 1)

  queue.processor = () => {
    throw new Error('Oh no')
  }
  await queue.add('Hello, World!')

  await queue._checkJobs()
  t.equal(retrying, 1)

  for (let i = 0; i < 10; i += 1) {
    await queue._checkJobs()
  }

  t.equal(success, 1)
  t.equal(retrying, 4)
  t.equal(error, 1)
})

Process('Check jobs limits processing', async ({ db }) => {
  const deadQueue = new PMongoQueue(db, 'dead-queue')
  const queue = new PMongoQueue(db, 'process', { deadQueue })

  await Promise.all(new Array(3).fill('').map(() => queue.add('Hello, World!')))

  queue.parallelism = 1
  queue.currentlyProcessing = 0
  queue.processor = async () => {
    await pause(100)
  }

  const jobs = Promise.all([queue._checkJobs(), queue._checkJobs(), queue._checkJobs()])

  // ensure only one is processed at once
  t.equal(await queue.inFlight(), 1)
  t.equal(await queue.size(), 2)

  await pause(100)
  queue._checkJobs()
  await pause(10)

  t.equal(await queue.inFlight(), 1)
  t.equal(await queue.size(), 1)

  await pause(100)
  queue._checkJobs()
  await pause(10)

  t.equal(await queue.inFlight(), 1)
  t.equal(await queue.size(), 0)

  await pause(100)

  t.equal(await queue.inFlight(), 0)
})

Process('Able to process all jobs', async ({ db }) => {
  const deadQueue = new PMongoQueue(db, 'dead-queue')
  const queue = new PMongoQueue(db, 'process', { deadQueue })

  await Promise.all(new Array(3).fill('').map(() => queue.add('Hello, World!')))

  let success = 0
  let error = 0
  let retrying = 0
  queue.on('succeeded', () => (success += 1))
  queue.on('retrying', () => (retrying += 1))
  queue.on('failed', () => (error += 1))

  queue.process(1, async () => {
    await pause(10)
  })

  await pause(100)
  await queue.stop()

  t.equal(success, 3)
})

Process('Able to process without parallelism', async ({ db }) => {
  const deadQueue = new PMongoQueue(db, 'dead-queue')
  const queue = new PMongoQueue(db, 'process', { deadQueue })

  for (let i = 0; i < 3; i += 1) {
    await queue.add('Hello, World!')
  }

  let success = 0
  let error = 0
  let retrying = 0
  queue.on('succeeded', () => (success += 1))
  queue.on('retrying', () => (retrying += 1))
  queue.on('failed', () => (error += 1))

  queue.process(async () => {
    await pause(10)
  })

  await pause(100)
  await queue.stop()

  t.equal(success, 3)
})

Process('Must call processor with function', async ({ db }) => {
  const queue = new PMongoQueue(db, 'process')

  t.throws(() => queue.process(), /.*Requires a processor.*/, 'Processor should throw with no provided function')
  await queue.stop()
})

Process('Must call process only once', async ({ db }) => {
  const queue = new PMongoQueue(db, 'process')

  queue.process(() => {})
  t.throws(() => queue.process(() => {}), /.*Function already called.*/, 'Processor should throw after duplicate')
  await queue.stop()
})

Process('Queue can be started after stopping', async ({ db }) => {
  const queue = new PMongoQueue(db, 'process')

  let success = 0
  queue.on('succeeded', () => (success += 1))

  await queue.add('Hello, World!')
  await queue.add('Hello, World!')

  queue.process(1, async () => {
    await pause(100)
  })

  t.equal(await queue.inFlight(), 1)
  t.equal(await queue.size(), 1)

  await queue.stop()
  await pause(250)

  t.equal(await queue.inFlight(), 0)
  t.equal(await queue.size(), 1)

  queue.start()

  await pause(20)

  t.equal(await queue.inFlight(), 1)

  await queue.stop()
})

Process.after(async ({ client }) => {
  await client.close()
})

Process.run()
