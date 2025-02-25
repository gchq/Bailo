import FileModel from '../models/File.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'

export async function up() {
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
