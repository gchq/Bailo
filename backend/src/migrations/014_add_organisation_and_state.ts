import ModelModel from '../models/Model.js'

export async function up() {
  await ModelModel.updateMany({ organisation: { $exists: false } }, { $set: { organisation: '' } })
  await ModelModel.updateMany({ state: { $exists: false } }, { $set: { state: '' } })
}

export async function down() {
  /* NOOP */
}
