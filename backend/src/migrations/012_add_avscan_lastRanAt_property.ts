import FileModel from '../models/File.js'

export async function up() {
  const files = await FileModel.find({})
  for (const file of files) {
    if (file.get('avScan') !== undefined) {
      for (const avResult of file.get('avScan')) {
        if (avResult.lastRunAt === undefined) {
          avResult.lastRunAt = file.createdAt
        }
      }
    }
    await file.save()
  }
}

export async function down() {
  /* NOOP */
}
