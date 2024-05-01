import ModelModel from '../models/Model.js'

export async function up() {
  const models = await ModelModel.find({})
  for (const model of models) {
    if (model.kind === undefined) {
      model.kind = 'model'
      await model.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
