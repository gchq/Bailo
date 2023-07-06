const crypto = require('crypto')
const { EventEmitter } = require('events')

// some helper functions
function id() {
  return crypto.randomBytes(16).toString('hex')
}

function now() {
  return new Date().toISOString()
}

function nowPlusSecs(secs) {
  return new Date(Date.now() + secs * 1000).toISOString()
}

function pause(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

module.exports = class Queue extends EventEmitter {
  constructor(db, name, opts) {
    if (!db) {
      throw new Error('p-mongo-queue: provide a mongodb.MongoClient.db')
    }
    // if (db instanceof EventEmitter) {
    //   throw new Error('p-mongo-queue: provide a mongodb.MongoClient.db from mongodb@4')
    // }
    if (!name) {
      throw new Error('p-mongo-queue: provide a queue name')
    }
    opts = opts || {}
    super()

    this.db = db
    this.name = name
    this.col = db.collection(name)
    this.visibility = opts.visibility || 30
    this.delay = opts.delay || 0

    if (opts.deadQueue) {
      this.deadQueue = opts.deadQueue
      this.maxRetries = opts.maxRetries || 5
    }
  }

  async createIndexes() {
    const indexName = await this.col.createIndex({ deleted: 1, visible: 1 })
    await this.col.createIndex({ ack: 1 }, { unique: true, sparse: true })

    return indexName
  }

  async add(payload, opts = {}) {
    const delay = opts.delay || this.delay
    const visible = delay ? nowPlusSecs(delay) : now()

    const msgs = []
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        throw new Error('Queue.add(): Array payload length must be greater than 0')
      }

      payload.forEach((item) => msgs.push({ visible, payload: item }))
    } else {
      msgs.push({ visible, payload })
    }

    const results = await this.col.insertMany(msgs)

    if (Array.isArray(payload)) {
      return String(results.insertedIds)
    }

    return String(results.insertedIds[0])
  }

  async get(opts = {}) {
    const visibility = opts.visibility || this.visibility
    const query = {
      deleted: null,
      visible: { $lte: now() },
    }
    const sort = {
      _id: 1,
    }
    const update = {
      $inc: { tries: 1 },
      $set: { ack: id(), visible: nowPlusSecs(visibility) },
    }

    const { value: doc } = await this.col.findOneAndUpdate(query, update, { sort, returnDocument: 'after' })
    if (!doc) return

    // convert to an external representation
    const msg = {
      id: String(doc._id),
      ack: doc.ack,
      payload: doc.payload,
      tries: doc.tries,
    }

    // if we have a deadQueue, then check the tries, else don't
    if (this.deadQueue && msg.tries > this.maxRetries) {
      // So:
      // 1) add this message to the deadQueue
      // 2) ack this message from the regular queue
      // 3) call ourself to return a new message (if exists)
      await this.deadQueue.add(msg)
      await this.ack(msg.ack)
      return this.get(opts)
    }

    return msg
  }

  async ping(ack, opts = {}) {
    const visibility = opts.visibility || this.visibility
    const query = {
      ack,
      visible: { $gt: now() },
      deleted: null,
    }
    const update = {
      $set: { visible: nowPlusSecs(visibility) },
    }
    const msg = await this.col.findOneAndUpdate(query, update, { returnDocument: 'after' })
    if (!msg.value) throw new Error(`Queue.ping(): Unidentified ack: ${ack}`)

    return String(msg.value._id)
  }

  async ack(ack) {
    const query = {
      ack,
      visible: { $gt: now() },
      deleted: null,
    }
    const update = {
      $set: { deleted: now() },
    }
    const msg = await this.col.findOneAndUpdate(query, update, { returnDocument: 'after' })
    if (!msg.value) throw new Error(`Queue.ack(): Unidentifier ack: ${ack}`)

    return String(msg.value._id)
  }

  async fail(ack) {
    const query = {
      ack,
    }
    const update = {
      $set: { visible: now() },
    }

    const msg = await this.col.findOneAndUpdate(query, update, { returnDocument: 'after' })
    if (!msg.value) throw new Error(`Queue.fail(): Unidentifier ack: ${ack}`)

    return String(msg.value._id)
  }

  async clean() {
    const query = {
      deleted: { $exists: true },
    }

    return this.col.deleteMany(query)
  }

  async total() {
    return this.col.countDocuments()
  }

  async size() {
    const query = {
      deleted: null,
      visible: { $lte: now() },
    }

    return this.col.countDocuments(query)
  }

  async inFlight() {
    let query = {
      ack: { $exists: true },
      visible: { $gt: now() },
      deleted: null,
    }

    return this.col.countDocuments(query)
  }

  async done() {
    const query = {
      deleted: { $exists: true },
    }

    return this.col.countDocuments(query)
  }

  process(parallelism, processor) {
    if (!processor) {
      processor = parallelism
      parallelism = 1
    }

    if (this.processor) {
      throw new Error('Queue.process(): Function already called, must be only called once.')
    }

    if (!processor || typeof processor !== 'function') {
      throw new Error('Queue.process(): Requires a processor provided')
    }

    this.parallelism = parallelism
    this.processor = processor
    this.currentlyProcessing = 0
    this.interval = setInterval(this._checkJobs.bind(this), 1000)
    this._checkJobs()
  }

  async stop() {
    clearInterval(this.interval)
    this.interval = undefined

    while (this.currentlyProcessing > 0) {
      await pause(100)
    }
  }

  async start() {
    this.interval = setInterval(this._checkJobs.bind(this), 1000)
    await this._checkJobs()
  }

  async _checkJobs() {
    if (this.currentlyProcessing >= this.parallelism) {
      return
    }

    this.currentlyProcessing += 1
    const message = await this.get()

    if (!message) {
      this.currentlyProcessing -= 1
      return
    }

    try {
      const processing = this.processor(message)
      await processing

      await this.ack(message.ack)
      this.emit('succeeded', message)
    } catch (e) {
      if (this.deadQueue && message.tries >= this.maxRetries) {
        this.emit('failed', message, e)
      } else {
        this.emit('retrying', message, e)
      }

      await this.fail(message.ack)
    }

    this.currentlyProcessing -= 1

    if (this.interval) {
      this._checkJobs()
    }
  }
}
