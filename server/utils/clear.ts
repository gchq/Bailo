import config from 'config'
import DeploymentModel from '../models/Deployment.js'
import ModelModel from '../models/Model.js'
import ApprovalModel from '../models/Approval.js'
import UserModel from '../models/User.js'
import VersionModel from '../models/Version.js'
import MigrationModel from '../models/Migration.js'
import { emptyBucket, ensureBucketExists } from './minio.js'

export async function clearStoredData() {
  if (config.get('minio.createBuckets')) {
    await ensureBucketExists(config.get('minio.uploadBucket'))
    await ensureBucketExists(config.get('minio.registryBucket'))
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
    emptyBucket(config.get('minio.uploadBucket')),
    emptyBucket(config.get('minio.registryBucket')),
  ])
}
