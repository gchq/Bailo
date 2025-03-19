import FileModel from '../models/File.js'

export async function up() {
  // patch to fix 009 not being fully successful
  const filesAvScanObject = await FileModel.find({ avScan: { $exists: true, $type: 'object' } })
  for (const file of filesAvScanObject) {
    const avScan = file.get('avScan')
    if (avScan !== undefined) {
      file.set('avScan', [avScan])
      file.markModified('avScan')
      await file.save()
    }
  }

  const filesAvScanArray = await FileModel.find({ avScan: { $exists: true, $type: 'array' } })
  for (const file of filesAvScanArray) {
    const avScan = file.get('avScan')
    if (avScan !== undefined) {
      let isModified = false
      for (const [index, avResult] of avScan.entries()) {
        if (avResult.lastRunAt === undefined) {
          avResult.lastRunAt = file.createdAt
          avScan[index] = avResult
          isModified = true
        }
      }
      if (isModified) {
        file.set('avScan', avScan)
        file.markModified('avScan')
        await file.save()
      }
    }
  }
}

export async function down() {
  /* NOOP */
}
