import DeploymentModel from '../models/Deployment.js'
import RequestModel from '../models/Request.js'
import ModelModel from '../models/Model.js'
import UserModel from '../models/User.js'
import VersionModel from '../models/Version.js'

import { connectToMongoose, disconnectFromMongoose } from './database.js'

import config from 'config'
import { emptyBucket } from './minio.js'

const pause = (time) => new Promise((resolve) => setTimeout(resolve, time))

export async function clearStoredData() {
  await connectToMongoose()

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
