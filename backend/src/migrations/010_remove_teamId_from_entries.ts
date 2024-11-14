import ModelModel from '../models/Model.js'

export async function up() {
  await ModelModel.updateMany({}, { $unset: { teamId: '' } }, { strict: false })
}

export async function down() {
  /* NOOP */
}
