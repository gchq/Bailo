import ReviewRoleModel from '../models/ReviewRole.js'
import { RoleKind } from '../types/types.js'

export async function up() {
  await ReviewRoleModel.updateMany({}, { $unset: { short: '' } }, { strict: false })
  await ReviewRoleModel.updateMany({ kind: 'schema' }, { $set: { kind: RoleKind.REVIEW } })
  const reviewRoles = await ReviewRoleModel.find()
  reviewRoles.forEach(async (role) => {
    if (role['shortName'] === undefined) {
      role['shortName'] = role.name.toLowerCase()
    }
    await role.save()
  })
}

export async function down() {
  /* NOOP */
}
