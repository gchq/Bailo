import type { Types } from 'mongoose'

import { ArtefactScanState } from '../connectors/artefactScanning/Base.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'

// The unique partial indexes on v2_scans previously filtered on state 'InProgress' rather than 'inProgress', so they
// never matched and duplicate in-progress scans could be created. Remove the duplicates, then rebuild both indexes
// with the corrected filter.
const imageIndexName = 'artefactKind_1_layerDigest_1_toolName_1'
const fileIndexName = 'artefactKind_1_fileId_1_toolName_1'

async function removeDuplicateInProgressScans(artefactKind: string, artefactIdField: string) {
  // Use the raw collection so soft-deleted scans are included, as the unique index also covers them.
  const duplicateGroups = await ScanModel.collection
    .aggregate<{ ids: Types.ObjectId[] }>([
      { $match: { artefactKind, state: ArtefactScanState.InProgress } },
      // Keep live scans over soft-deleted ones, then the most recently run.
      { $sort: { deleted: 1, lastRunAt: -1, _id: -1 } },
      {
        $group: {
          _id: { artefactKind: '$artefactKind', artefactId: `$${artefactIdField}`, toolName: '$toolName' },
          ids: { $push: '$_id' },
        },
      },
      { $match: { 'ids.1': { $exists: true } } },
    ])
    .toArray()

  const idsToRemove = duplicateGroups.flatMap((group) => group.ids.slice(1))
  if (idsToRemove.length > 0) {
    await ScanModel.collection.deleteMany({ _id: { $in: idsToRemove } })
  }
}

export async function up() {
  await removeDuplicateInProgressScans(ArtefactKind.IMAGE, 'layerDigest')
  await removeDuplicateInProgressScans(ArtefactKind.FILE, 'fileId')

  const indexes = await ScanModel.collection.indexes()
  const indexNames = indexes.map((index) => index.name)
  if (indexNames.includes(imageIndexName)) {
    await ScanModel.collection.dropIndex(imageIndexName)
  }
  if (indexNames.includes(fileIndexName)) {
    await ScanModel.collection.dropIndex(fileIndexName)
  }

  // Recreate from the schema definitions so the partial filters match ScanSchema.
  await ScanModel.createIndexes()
}

export async function down() {
  /* NOOP */
}
