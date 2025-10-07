import { Readable } from 'node:stream'

import { putObjectStream } from '../../../clients/s3.js'
import FileModel from '../../../models/File.js'
import config from '../../../utils/config.js'
import { createFilePath, markFileAsCompleteAfterImport } from '../../file.js'
import log from '../../log.js'

export async function importModelFile(body: Readable, fileId: string, mirroredModelId: string, importId: string) {
  const bucket = config.s3.buckets.uploads
  const updatedPath = createFilePath(mirroredModelId, fileId)
  const foundFile = await FileModel.findOne({ path: updatedPath, complete: true })
  if (foundFile) {
    log.debug({ bucket, path: updatedPath, importId }, 'Skipping imported file as it has already been uploaded to S3.')
  } else {
    await putObjectStream(updatedPath, body, bucket)
    log.debug({ bucket, path: updatedPath, importId }, 'Imported file successfully uploaded to S3.')
    await markFileAsCompleteAfterImport(updatedPath)
  }
  return { sourcePath: fileId, newPath: updatedPath }
}
