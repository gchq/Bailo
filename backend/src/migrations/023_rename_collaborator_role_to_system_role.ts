import ReviewRoleModel from '../models/ReviewRole.js'

export async function up() {
  await ReviewRoleModel.updateMany({}, { $rename: { collaboratorRole: 'systemRole' } }, { strict: false })
}

export async function down() {
  /* NOOP */
}
