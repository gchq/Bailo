import FileModel from '../models/File.js'

export async function up() {
  const results = await FileModel.find({ avScan: { $type: 'object' } }, null, { strict: false, lean: true })
  results.forEach(async (result) => {
    if (!Array.isArray(result.avScan)) {
      await FileModel.findOneAndUpdate({ _id: result._id }, { $set: { avScan: [result.avScan] } })
    }
  })
}

export async function down() {
  /* NOOP */
}
