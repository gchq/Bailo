import DeploymentModel from '../models/Deployment.js'
import ModelModel from '../models/Model.js'
import ApprovalModel from '../models/Approval.js'
import UserModel from '../models/User.js'
import VersionModel from '../models/Version.js'
import MigrationModel from '../models/Migration.js'
import { emptyBucket, ensureBucketExists } from './minio.js'
import config from './config.js'

export async function clearStoredData() {
  if (config.minio.automaticallyCreateBuckets) {
    await ensureBucketExists(config.minio.buckets.uploads)
    await ensureBucketExists(config.minio.buckets.registry)
  }

  await Promise.all([
    // delete all files from mongo
    DeploymentModel.deleteMany({}),
    ApprovalModel.deleteMany({}),
    ModelModel.deleteMany({}),
    UserModel.deleteMany({}),
    VersionModel.deleteMany({}),
    MigrationModel.deleteMany({}),

    // empty minio buckets
    emptyBucket(config.minio.buckets.uploads),
    emptyBucket(config.minio.buckets.registry),
  ])
}
