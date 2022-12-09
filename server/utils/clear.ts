import config from 'config'
import DeploymentModel from '../models/Deployment'
import ModelModel from '../models/Model'
import RequestModel from '../models/Request'
import UserModel from '../models/User'
import VersionModel from '../models/Version'
import MigrationModel from '../models/Migration'
import { emptyBucket, ensureBucketExists } from './minio'

export async function clearStoredData() {
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
    MigrationModel.deleteMany({}),

    // empty minio buckets
    emptyBucket(config.get('minio.uploadBucket')),
    emptyBucket(config.get('minio.registryBucket')),
  ])
}
