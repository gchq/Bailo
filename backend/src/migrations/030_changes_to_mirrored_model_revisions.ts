import Model, { EntryKind } from '../models/Model.js'
import ModelCardRevisionModel from '../models/ModelCardRevision.js'

export async function up() {
  const indexes = await ModelCardRevisionModel.collection.getIndexes()
  if ('modelId_1_version_1' in indexes) {
    await ModelCardRevisionModel.collection.dropIndex('modelId_1_version_1')
  }
  await ModelCardRevisionModel.updateMany({}, { $set: { mirrored: false } })
  const mirroredModels = await Model.find({ kind: EntryKind.MirroredModel })
  for (const model of mirroredModels) {
    model.set('mirroredCard', { ...model.card, mirrored: true }, { strict: false })
    model.set('card.metadata', {}, { strict: false })
    model.set('card.version', 1, { strict: false })
    model.set('card.mirrored', true, { strict: false })
    await model.save()
  }
}

export async function down() {}
