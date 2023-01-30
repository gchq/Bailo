// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { VersionDoc } from 'server/models/Version'
import logger from '../utils/logger'
import ModelModel from '../models/Model'

export async function up() {
  const models = await ModelModel.find({})

  logger.info({ count: models.length }, 'Processing models')
  for (const model of models) {
    delete model.currentMetada
    const latestVersion = model.versions.reduce((a: VersionDoc, b: VersionDoc) => (a.ceatedAt > b.createdAt ? a : b))
    model.latestVersion = latestVersion._id
    model.markModified('latestVersion')
    await model.save()
  }
}

export async function down() {
  // not implemented
}
