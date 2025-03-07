import FileModel from '../models/File.js'

export async function up() {
  const results = await FileModel.find({ avScan: { $type: 'object' } }, null, { strict: false, lean: true })
  results.forEach(async (result) => {
    if (result.get('avScan') !== undefined) {
      if (!Array.isArray(result.get('avScan'))) {
        await FileModel.findOneAndUpdate({ _id: result._id }, { $set: { avScan: [result.get('avScan')] } })
      }
    }
  })
}

export async function down() {
  /* NOOP */
}
