import TokenModel from '../models/Token.js'

export async function up() {
  const permissionsToRemove = ['schema:read', 'token:read', 'token:write']
  await TokenModel.updateMany({}, { $pull: { actions: { $in: permissionsToRemove } } })
}

export async function down() {}
