import FileModel from '../models/File.js'

export async function up() {
  const results = await FileModel.find({ avScan: { $type: 'object' } }, null, { strict: false, lean: true })
  results.forEach(async (result) => {
    const avScan = result['avScan']
    if (avScan !== undefined) {
      if (!Array.isArray(avScan)) {
        await FileModel.findOneAndUpdate({ _id: result._id }, { $set: { avScan: [avScan] } })
      }
    }
  })
}

export async function down() {
  /* NOOP */
}
