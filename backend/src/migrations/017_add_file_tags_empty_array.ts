import FileModel from '../models/File.js'

export async function up() {
  await FileModel.updateMany({ tags: { $exists: false } }, { $set: { tags: [] } })
}
