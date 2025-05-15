import FileModel from '../models/File.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'

export async function up() {
  // convert avScan from being stored in File to a new Scan Document
  const files = await FileModel.find({})
  for (const file of files) {
    const avScan = file.get('avScan')
    if (avScan !== undefined) {
      for (const avResult of avScan) {
        if (avResult['state'] === 'notScanned') {
          continue
        }
        // toolName was originally not a required field so may not exist
        if (!Object.prototype.hasOwnProperty.call(avResult, 'toolName')) {
          avResult.toolName = 'Unknown Scanner'
        }
        // create new Scan Document
        const newScan = new ScanModel({
          artefactKind: ArtefactKind.File,
          fileId: file._id.toString(),
          ...avResult,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        })
        await newScan.save()
      }
    }
  }
  // remove all old avScan fields
  await FileModel.updateMany({ avScan: { $exists: true } }, { $unset: { avScan: 1 } }, { strict: false })
}

export async function down() {
  /* NOOP */
}
