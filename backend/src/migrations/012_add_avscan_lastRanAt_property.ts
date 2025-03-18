import FileModel from '../models/File.js'

export async function up() {
  const filesAvScanArray = await FileModel.find({ avScan: { $exists: true, $type: 'array' } })
  for (const file of filesAvScanArray) {
    const avScan = file['avScan']
    if (avScan !== undefined) {
      for (const avResult of avScan) {
        if (avResult.lastRunAt === undefined) {
          avResult.lastRunAt = file.createdAt
        }
      }
    }
    await file.save()
  }

  // patch to fix 009 not being fully successful
  const filesAvScanObject = await FileModel.find({ avScan: { $exists: true, $type: 'object' } })
  for (const file of filesAvScanObject) {
    const avScan = file['avScan']
    if (avScan !== undefined) {
      if (avScan.lastRunAt === undefined) {
        avScan.lastRunAt = file.createdAt
      }
      file.set('avScan', [avScan])
      await file.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
