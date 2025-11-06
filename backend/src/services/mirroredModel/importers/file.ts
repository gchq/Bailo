import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'

import { putObjectStream } from '../../../clients/s3.js'
import FileModel from '../../../models/File.js'
import config from '../../../utils/config.js'
import { InternalError } from '../../../utils/error.js'
import { createFilePath, markFileAsCompleteAfterImport } from '../../file.js'
import log from '../../log.js'
import { MirrorKind, MirrorKindKeys, MirrorLogData } from '../mirroredModel.js'
import { BaseImporter, BaseMirrorMetadata } from './base.js'

export type FileMirrorMetadata = BaseMirrorMetadata & { importKind: MirrorKindKeys<'File'>; filePath: string }
export type FileMirrorInformation = {
  metadata: FileMirrorMetadata
  sourcePath: string
  newPath: string
}

export class FileImporter extends BaseImporter {
  declare protected readonly metadata: FileMirrorMetadata

  protected readonly bucket: string
  protected readonly updatedPath: string

  protected extractedFile: boolean = false

  constructor(metadata: FileMirrorMetadata, logData: MirrorLogData) {
    super(metadata, logData)
    if (this.metadata.importKind !== MirrorKind.File) {
      throw InternalError('Cannot parse compressed File: incorrect metadata specified.', {
        metadata: this.metadata,
        ...this.logData,
      })
    }
    this.bucket = config.s3.buckets.uploads
    this.updatedPath = createFilePath(this.metadata.mirroredModelId, this.metadata.filePath)
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    if (entry.type === 'file') {
      // Process file
      if (this.extractedFile) {
        throw InternalError('Cannot parse compressed file: multiple files found.', {
          mirroredModelId: this.metadata.mirroredModelId,
          fileId: this.metadata.filePath,
          entry,
          metadata: this.metadata,
          ...this.logData,
        })
      } else {
        const foundFile = await FileModel.findOne({ path: this.updatedPath, complete: true })
        if (foundFile) {
          log.debug(
            { bucket: this.bucket, path: this.updatedPath, ...this.logData },
            'Skipping imported file as it has already been uploaded to S3.',
          )
          // auto-drain the stream
          stream.resume()
        } else {
          await putObjectStream(this.updatedPath, stream, this.bucket)
          await markFileAsCompleteAfterImport(this.updatedPath)
          log.debug(
            { bucket: this.bucket, path: this.updatedPath, name: entry.name, ...this.logData },
            'Imported file successfully uploaded to S3.',
          )
        }
        this.extractedFile = true
      }
    } else {
      // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
      log.debug({ name: entry.name, type: entry.type, ...this.logData }, 'Skipping non-file entry.')
    }
  }

  // Type resolve
  finishListener(resolve: (reason?: FileMirrorInformation) => void, _reject: (reason?: unknown) => void) {
    resolve({ metadata: this.metadata, sourcePath: this.metadata.filePath, newPath: this.updatedPath })
  }
}
