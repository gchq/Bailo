import SchemaModel from '../models/Schema.js'

export async function up() {
  await SchemaModel.updateMany({}, { $set: { reviewRoles: [] } }, { strict: false })
}

export async function down() {
  /* NOOP */
}
