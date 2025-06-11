import FileModel from '../models/File.js'

export async function up() {
  const files = await FileModel.find({})
  for (const file of files) {
    if (file.get('bucket') !== undefined) {
      file.set('bucket', undefined, { strict: false })
      await file.save()
    }
  }
}
