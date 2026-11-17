import ModelModel from '../models/Model.js'
import { toSearchGrams } from '../utils/search.js'

export async function up() {
  // The soft delete plugin hides deleted entries unless asked for explicitly, so backfill both so restores stay searchable
  const models = [
    ...(await ModelModel.find({}, { id: 1, name: 1, description: 1, tags: 1 }).lean()),
    ...(await ModelModel.find({ deleted: true }, { id: 1, name: 1, description: 1, tags: 1 }).lean()),
  ]
  for (const model of models) {
    await ModelModel.updateOne(
      { id: model.id },
      { $set: { searchGrams: toSearchGrams(model.name, model.description, ...(model.tags ?? [])) } },
      { timestamps: false },
    )
  }
}

export async function down() {
  await ModelModel.updateMany({}, { $unset: { searchGrams: '' } }, { timestamps: false })
}
