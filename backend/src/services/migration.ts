import MigrationModel, { MigrationMetadata } from '../models/Migration.js'

export async function doesMigrationExist(name: string) {
  const nameWithNoExtension = name.split('.')[0]
  const migration = await MigrationModel.findOne({
    name: { $regex: nameWithNoExtension },
  })

  if (!migration) {
    return false
  }

  return true
}

export async function markMigrationComplete(name: string, metadata: MigrationMetadata | undefined) {
  if (metadata) {
    await MigrationModel.create({
      name,
      metadata,
    })
  } else {
    await MigrationModel.create({
      name,
    })
  }
}
