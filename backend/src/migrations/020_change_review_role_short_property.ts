import ReviewRoleModel from '../models/ReviewRole.js'
import { RoleKind } from '../types/types.js'

export async function up() {
  await ReviewRoleModel.updateMany({}, { $unset: { short: '', id: '' } }, { strict: false })
  const indexes = await ReviewRoleModel.collection.getIndexes()
  if ('id_1' in indexes) {
    await ReviewRoleModel.collection.dropIndex('id_1')
  }
  if ('short_1' in indexes) {
    await ReviewRoleModel.collection.dropIndex('short_1')
  }
  await ReviewRoleModel.updateMany({ kind: 'schema' }, { $set: { kind: RoleKind.REVIEW } })
  const reviewRoles = await ReviewRoleModel.find()
  for (const reviewRole of reviewRoles) {
    if (reviewRole['shortName'] === undefined) {
      reviewRole['shortName'] = reviewRole.name.toLowerCase()
    }
    await reviewRole.save()
  }
}

export async function down() {
  /* NOOP */
}
