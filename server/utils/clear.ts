import config from 'config'
import DeploymentModel from '../models/Deployment'
import ModelModel from '../models/Model'
import RequestModel from '../models/Request'
import UserModel from '../models/User'
import VersionModel from '../models/Version'
import { connectToMongoose, disconnectFromMongoose } from './database'
import { emptyBucket, ensureBucketExists } from './minio'

const pause = (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

export async function clearStoredData() {
  await connectToMongoose()

  if (config.get('minio.createBuckets')) {
    await ensureBucketExists(config.get('minio.uploadBucket'))
    await ensureBucketExists(config.get('minio.registryBucket'))
  }

  await Promise.all([
    // delete all files from mongo
    DeploymentModel.deleteMany({}),
    RequestModel.deleteMany({}),
    ModelModel.deleteMany({}),
    UserModel.deleteMany({}),
    VersionModel.deleteMany({}),

    // empty minio buckets
    emptyBucket(config.get('minio.uploadBucket')),
    emptyBucket(config.get('minio.registryBucket')),
  ])

  // small pause to ensure Mongoose has finished
  await pause(250)
  await disconnectFromMongoose()
}
