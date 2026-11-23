import ModelModel, { ModelSearchFields } from '../models/Model.js'
import { toEntrySearchGrams } from '../utils/search.js'

export async function up() {
  // The soft delete plugin hides deleted entries unless asked for explicitly, so backfill both so restores stay searchable
  for (const filter of [{}, { deleted: true }]) {
    // Stream in batches rather than loading every model into memory
    const projection = { id: 1, ...Object.fromEntries(ModelSearchFields.map((field) => [field, 1])) }
    const models = ModelModel.find(filter, projection).lean().cursor()
    for await (const model of models) {
      await ModelModel.updateOne(
        { id: model.id },
        { $set: { searchGrams: toEntrySearchGrams(model, ModelSearchFields) } },
        { timestamps: false },
      )
    }
  }
}

export async function down() {
  await ModelModel.updateMany({}, { $unset: { searchGrams: '' } }, { timestamps: false })
}
