import { Collection, Document, MongoClient, ObjectId } from 'mongodb'

import config from '../utils/config.js'
import logger from '../utils/logger.js'

const batchSize = 100

const moveRequests = async (
  requestsCollection: Collection<Document>,
  approvalsCollection: Collection<Document>,
): Promise<boolean> => {
  const requests = await requestsCollection.find({}, { limit: batchSize }).toArray()

  if (requests.length) {
    const requestIds: ObjectId[] = []
    const bulkUpsert = approvalsCollection.initializeOrderedBulkOp()

    requests.forEach((request) => {
      requestIds.push(request._id)
      request.approvalCategory = request.request
      delete request.request
      bulkUpsert.insert(request)
    })

    await bulkUpsert.execute()
    await requestsCollection.deleteMany({ _id: { $in: requestIds } })
  }

  return requests.length < batchSize
}

export async function up() {
  const client = new MongoClient(config.mongo.uri)
  await client.connect()
  const db = client.db('bailo')

  logger.info('Looking for requests collection')
  if (await db.listCollections({ name: 'requests' }).hasNext()) {
    const requestsCollection = db.collection('requests')
    const approvalsCollection = db.collection('approvals')
    let isDone = false

    logger.info('Moving all requests to approvals collection')
    while (!isDone) {
      isDone = await moveRequests(requestsCollection, approvalsCollection)
    }

    logger.info('Dropping requests collection')
    await requestsCollection.drop()
  }
}

export async function down() {
  // not implemented
}
