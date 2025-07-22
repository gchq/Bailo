import ReviewRoleModel from '../models/ReviewRole.js'

export async function up() {
  await ReviewRoleModel.updateMany({ collaboratorRole: 'none' }, { $unset: { collaboratorRole: 1 } }, { strict: false })
}

export async function down() {
  /* NOOP */
}
