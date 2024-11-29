import MigrationModel, { MigrationMetadata } from '../models/Migration.js'

export async function doesMigrationExist(name: string) {
  const migration = await MigrationModel.findOne({
    name,
  })

  if (!migration) {
    return false
  }

  return true
}

export async function markMigrationComplete(name: string, metadata: MigrationMetadata | undefined) {
  metadata
    ? await MigrationModel.create({
        name,
        metadata,
      })
    : await MigrationModel.create({
        name,
      })
}
