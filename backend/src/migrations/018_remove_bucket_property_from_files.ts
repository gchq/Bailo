import FileModel from '../models/File.js'

export async function up() {
  await FileModel.updateMany({ tags: { $exists: true } }, { $unset: { tags: 1 } }, { strict: false })
}
