import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

let mongod: MongoMemoryServer
beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  mongoose.set('strictQuery', false)
  mongoose.set('strictPopulate', false)
  await mongoose.connect(mongod.getUri())
})

beforeEach(() => {
  // your code
})

afterEach(async () => {
  // clearing a collection takes ~1ms, so this adds
  // negligible time to each test.
  const collections = await mongoose.connection.db.listCollections().toArray()
  await Promise.all(collections.map((collection) => mongoose.connection.db.dropCollection(collection.name)))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
