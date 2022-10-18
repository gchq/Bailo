import config from 'config'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod: MongoMemoryServer
beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), config.get('mongo.connectionOptions'))
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
