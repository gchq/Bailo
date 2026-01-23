import Model, { EntryKind } from '../models/Model.js'
import ModelCardRevisionModel from '../models/ModelCardRevision.js'

export async function up() {
  const indexes = await ModelCardRevisionModel.collection.getIndexes()
  if ('modelId_1_version_1' in indexes) {
    await ModelCardRevisionModel.collection.dropIndex('modelId_1_version_1')
  }
  const mirroredModels = await Model.find({ kind: EntryKind.MirroredModel })
  const mirroredModelIds: string[] = mirroredModels.map((model) => model.id)
  await ModelCardRevisionModel.updateMany({ modelId: { $in: mirroredModelIds } }, { mirrored: true })
  await ModelCardRevisionModel.updateMany({ modelId: { $nin: mirroredModelIds } }, { mirrored: false })

  for (const model of mirroredModels) {
    if (!model.mirroredCard || !model.mirroredCard.schemaId) {
      model.set('mirroredCard', { ...model.card, mirrored: true }, { strict: false })
      model.set('card.metadata', {}, { strict: false })
      model.set('card.version', 1, { strict: false })
      if (model.card?.mirrored === undefined) {
        model.set('card.mirrored', false, { strict: false })
      }
      await model.save()
    }
  }
}

export async function down() {}
