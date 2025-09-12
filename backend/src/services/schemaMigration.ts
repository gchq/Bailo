import { SchemaAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import SchemaMigration, { SchemaMigrationInterface } from '../models/SchemaMigration.js'
import { UserInterface } from '../models/User.js'
import { Forbidden } from '../utils/error.js'
import { handleDuplicateKeys } from '../utils/mongo.js'

export async function createSchemaMigrationPlan(
  user: UserInterface,
  schemaMigration: Partial<SchemaMigrationInterface>,
) {
  const schemaMigrationDoc = new SchemaMigration(schemaMigration)

  const auth = await authorisation.schemaMigration(user, schemaMigrationDoc, SchemaAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaMigrationNameId: schemaMigrationDoc.name,
    })
  }

  try {
    return await schemaMigrationDoc.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }
}

export async function searchSchemaMigrations() {
  return await SchemaMigration.find()
}
