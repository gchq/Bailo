import config from 'config'
import { MongoClient } from 'mongodb'
import logger from '../utils/logger'

export async function up() {
  // TODO me - mongoose connection options don't directly map to mongodb connection options (are some of them no longer needed?)
  const client = new MongoClient(await config.get('mongo.uri'))
  await client.connect()

  const db = client.db('bailo')

  if (await db.listCollections({ name: 'requests' }).hasNext()) {
    const approvalsCollection = db.collection('approvals')
    const requestsCollection = db.collection('requests')
    const requests = await requestsCollection.find({}).toArray()

    if (requests.length) {
      logger.info('Moving all requests to approvals collection')
      const bulkUpsert = approvalsCollection.initializeOrderedBulkOp()

      requests.forEach((request) => {
        request.approvalCategory = request.request
        delete request.request
        bulkUpsert.find({ _id: request._id }).upsert().replaceOne(request)
      })

      await bulkUpsert.execute()
    }

    logger.info('Dropping requests collection')
    await requestsCollection.drop()
  }
}

export async function down() {
  // not implemented
}
