import FileModel from '../models/File.js'

export async function up() {
  const results = await FileModel.find({ avScan: { $type: 'object' } }, null, { strict: false })
  for (const result of results) {
    const avScan = result.get('avScan')
    if (avScan !== undefined) {
      if (!Array.isArray(avScan)) {
        await FileModel.findOneAndUpdate({ _id: result._id }, { $set: { avScan: [avScan] } })
      }
    }
  }
}

export async function down() {
  /* NOOP */
}
