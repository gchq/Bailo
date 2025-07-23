import ReviewRoleModel from '../models/ReviewRole.js'

export async function up() {
  await ReviewRoleModel.updateMany({}, { $unset: { short: '' } }, { strict: false })
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
