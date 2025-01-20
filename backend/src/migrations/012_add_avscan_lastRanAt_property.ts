import FileModel from '../models/File.js'

export async function up() {
  const files = await FileModel.find({})
  for (const file of files) {
    for (const avResult of file.avScan) {
      if (avResult.lastRunAt === undefined) {
        avResult.lastRunAt = file.createdAt
      }
    }
    await file.save()
  }
}

export async function down() {
  /* NOOP */
}
