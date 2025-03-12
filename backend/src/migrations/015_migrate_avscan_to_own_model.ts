import FileModel from '../models/File.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'

export async function up() {
  // toolName was originally not a required field so may not exist
  const filesMissingToolName = await FileModel.find({
    avScan: { $exists: true },
    'avScan.toolName': { $exists: false },
  })
  for (const file of filesMissingToolName) {
    if (file.get('avScan') !== undefined) {
      for (const avResult of file.get('avScan')) {
        if (!('toolName' in avResult)) {
          avResult.toolName = 'Unknown Scanner'
        }
      }
      await file.save()
    }
  }
  // convert avScan from being stored in File to a new Scan Document
  const files = await FileModel.find({})
  for (const file of files) {
    if (file.get('avScan') !== undefined) {
      for (const avResult of file.get('avScan')) {
        // create new Scan Document
        const newScan = new ScanModel({
          artefactKind: ArtefactKind.File,
          fileId: file._id,
          ...avResult,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        })
        await newScan.save()
      }
    }
  }
  // remove all old avScan fields
  await FileModel.updateMany({ avScan: { $exists: true } }, { $unset: { avScan: 1 } })
}

export async function down() {
  /* NOOP */
}
