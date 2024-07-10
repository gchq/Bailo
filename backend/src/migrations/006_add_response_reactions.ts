import ResponseModel from '../models/Response.js'

export async function up() {
  await ResponseModel.updateMany({ reactions: { $exists: false } }, { $set: { reactions: [] } })
}

export async function down() {
  /* NOOP */
}
