import { Readable } from 'node:stream'

import { putObjectStream } from '../../../clients/s3.js'
import FileModel from '../../../models/File.js'
import config from '../../../utils/config.js'
import { InternalError } from '../../../utils/error.js'
import { extractTarGzStream } from '../../../utils/tarball.js'
import { createFilePath, markFileAsCompleteAfterImport } from '../../file.js'
import log from '../../log.js'

export async function importModelFile(body: Readable, fileId: string, mirroredModelId: string, importId: string) {
  const bucket = config.s3.buckets.uploads
  const updatedPath = createFilePath(mirroredModelId, fileId)
  const foundFile = await FileModel.findOne({ path: updatedPath, complete: true })
  if (foundFile) {
    log.debug({ bucket, path: updatedPath, importId }, 'Skipping imported file as it has already been uploaded to S3.')
  } else {
    let extractedFile = false
    await extractTarGzStream(body, async function (entry, stream, next) {
      log.debug(
        {
          name: entry.name,
          type: entry.type,
          size: entry.size,
          importId,
        },
        'Processing un-tarred entry.',
      )

      if (entry.type === 'file') {
        // Process file
        if (extractedFile) {
          throw InternalError('Cannot parse compressed file: multiple files found.', {
            mirroredModelId,
            fileId,
            importId,
            entry,
          })
        } else {
          await putObjectStream(updatedPath, stream, bucket)
          await markFileAsCompleteAfterImport(updatedPath)
          log.debug({ bucket, path: updatedPath, entry, importId }, 'Imported file successfully uploaded to S3.')
          extractedFile = true
        }
      } else {
        // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
        log.warn({ name: entry.name, type: entry.type, importId }, 'Skipping non-file entry.')
      }
      next()
    })
    log.debug({ importId }, 'Completed extracting archive.')
  }
  return { sourcePath: fileId, newPath: updatedPath }
}
