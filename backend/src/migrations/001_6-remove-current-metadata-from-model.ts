import ModelModel from '../models/Model.js'
import { VersionDoc } from '../types/types.js'
import logger from '../utils/logger.js'

export async function up() {
  const models = await ModelModel.find({})

  logger.info({ count: models.length }, 'Processing models')
  for (const model of models) {
    const latestVersion = (model.versions as VersionDoc[]).reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    model.latestVersion = latestVersion._id
    model.markModified('latestVersion')
    model.set('currentMetadata', undefined, { strict: false })
    await model.save()
  }
}

export async function down() {
  // not implemented
}
