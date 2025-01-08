import prettyBytes from 'pretty-bytes'

import FileModel from '../models/File.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

// Helper file for getTotalStorageUsed.sh

async function main() {
  await connectToMongoose()

  const existingResults = await FileModel.find({})
  const deletedResults = await (FileModel as any).findDeleted()

  await disconnectFromMongoose()

  const totalExistingBytes = existingResults.reduce((sum, fileModel) => sum + fileModel.size, 0)
  const totalDeletedBytes = deletedResults.reduce((sum, fileModel) => sum + fileModel.size, 0)

  const totalBytes = {
    existing: totalExistingBytes,
    deleted: totalDeletedBytes,
    total: totalExistingBytes + totalDeletedBytes,
  }
  const totalFormattedBytes = Object.fromEntries(
    Object.entries(totalBytes).map(([key, value]) => [key, prettyBytes(value)]),
  )

  log.info(totalBytes, 'Storage used:')
  log.info(totalFormattedBytes, 'Formatted storage used:')
}
main()
