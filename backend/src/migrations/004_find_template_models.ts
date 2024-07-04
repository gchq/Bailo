import ModelModel from '../models/Model.js'

export async function up() {
  const models = await ModelModel.find({})
  for (const model of models) {
    if (model.settings.allowTemplating === undefined) {
      model.settings.allowTemplating = false
      await model.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
