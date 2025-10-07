import ModelModel from '../models/Model.js'

export async function up() {
  await ModelModel.updateMany({}, { $set: { tags: [] } })
  const modelsWithTags = await ModelModel.find({ 'card.metadata.overview.tags': { $exists: true } })
  for (const model of modelsWithTags) {
    if (!model.card || !model.card.metadata.overview) {
      return
    }
    model.tags = model.card.metadata.overview.tags as string[]
    model.set('card.metadata.overview.tags', undefined, { strict: false })
    await model.save()
  }
  ModelModel.updateMany(
    { 'card.metadata.overview.tags': { $exists: true } },
    { $unset: { 'card.metadata.overview.tags': 1 } },
  )
}

export async function down() {
  const modelsWithTags = await ModelModel.find({ tags: { $exists: true } })
  for (const model of modelsWithTags) {
    if (!model.card || !model.card.metadata.overview) {
      return
    }
    model.card.metadata.overview.tags = model.tags
    await ModelModel.updateMany({}, { $unset: { tags: 1 } })
    await model.save()
  }
}
