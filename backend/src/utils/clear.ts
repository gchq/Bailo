import ApprovalModel from '../models/Approval.js'
import DeploymentModel from '../models/Deployment.js'
import MigrationModel from '../models/Migration.js'
import ModelModel from '../models/Model.js'
import UserModel from '../models/User.js'
import VersionModel from '../models/Version.js'
import config from './config.js'
import { emptyBucket, ensureBucketExists } from './minio.js'

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
