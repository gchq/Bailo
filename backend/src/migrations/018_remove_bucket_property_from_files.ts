import FileModel from '../models/File.js'

export async function up() {
  await FileModel.updateMany({ bucket: { $exists: true } }, { $unset: { bucket: 1 } }, { strict: false })
}
