import FileModel from '../models/File.js'
import ScanModel, { ArtefactType } from '../models/Scan.js'

export async function up() {
  // convert avScan from being stored in File to a new Scan Document
  const files = await FileModel.find({ avScan: { $exists: true } })
  for (const file of files) {
    // TS linting fix - we already check for existing so this should never happen
    if (file.avScan === undefined) {
      continue
    }
    for (const avResult of file.avScan) {
      // create new Scan Document
      const newScan = new ScanModel({
        artefactType: ArtefactType.File,
        fileId: file._id,
        toolName: avResult.toolName,
        scannerVersion: avResult.scannerVersion,
        state: avResult.state,
        isInfected: avResult.isInfected,
        viruses: avResult.viruses,
        lastRunAt: avResult.lastRunAt,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      })
      await newScan.save()
    }
  }
  // remove all old avScan fields
  await FileModel.updateMany({ avScan: { $exists: true } }, { $unset: { avScan: 1 } })
}

export async function down() {
  /* NOOP */
}
