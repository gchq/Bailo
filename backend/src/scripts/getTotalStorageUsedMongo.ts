import prettyBytes from 'pretty-bytes'

import FileModel from '../models/File.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function main() {
  await connectToMongoose()

  const existingResults = await FileModel.find({})
  // mongoose-delete plugin doesn't have correct typing so cast to any
  const deletedResults = await (FileModel as any).findDeleted()

  setTimeout(disconnectFromMongoose, 50)

  const totalExistingBytes = existingResults.reduce((sum, fileModel) => sum + fileModel.size, 0)
  const totalDeletedBytes = deletedResults.reduce((sum, fileModel) => sum + fileModel.size, 0)

  const totalBytes = {
    existing: totalExistingBytes,
    deleted: totalDeletedBytes,
    total: totalExistingBytes + totalDeletedBytes,
  }
  // Copy of totalBytes with human readable values
  const totalFormattedBytes = Object.fromEntries(
    Object.entries(totalBytes).map(([key, value]) => [key, prettyBytes(value)]),
  )

  // Print results
  log.info(totalBytes, 'Storage used:')
  log.info(totalFormattedBytes, 'Formatted storage used:')
}

main()
