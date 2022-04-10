import { MongoClient } from 'mongodb'

const url = `mongodb://localhost:27017`
const dbName = 'mongodb-queue'

export async function getClient(collection) {
  const client = new MongoClient(url)
  await client.connect()

  const db = client.db(dbName)
  const col = db.collection(collection)
  try {
    await col.drop()
  } catch (e) {}

  return { client, db, col }
}
