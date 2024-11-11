import FileModel from '../models/File.js'

export async function up() {
  const files = await FileModel.find()
  files.forEach(async (file) => {
    if (!Array.isArray(file.avScan)) {
      const avScanArray = [file.avScan]
      file.avScan = avScanArray
      await file.save()
    }
  })
}

export async function down() {
  /* NOOP */
}
