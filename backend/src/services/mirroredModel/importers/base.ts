import { PassThrough, Readable } from 'node:stream'

import { Headers } from 'tar-stream'

import { isBailoError } from '../../../types/error.js'
import { InternalError } from '../../../utils/error.js'
import { MirrorLogData } from '../mirroredModel.js'

export type BaseMirrorMetadata = {
  schemaVersion: number
  sourceModelId: string
  mirroredModelId: string
  exporter: string
}

export abstract class BaseImporter {
  abstract processEntry(entry: Headers, stream: PassThrough | Readable): Promise<void> | void

  protected readonly metadata: BaseMirrorMetadata
  protected readonly logData: MirrorLogData

  constructor(metadata: BaseMirrorMetadata, logData: MirrorLogData) {
    this.metadata = metadata
    this.logData = { importerType: this.constructor.name, ...logData }
  }

  getMetadata() {
    return this.metadata
  }

  // use `any` as "real" types are not a subtype `unknown`
  errorListener(error: unknown, _resolve: (reason?: any) => void, reject: (reason?: unknown) => void) {
    if (isBailoError(error)) {
      reject(error)
    } else {
      reject(
        InternalError('Error processing tarball during import.', { error, metadata: this.metadata, ...this.logData }),
      )
    }
  }

  // use `any` as "real" types are not a subtype `unknown`
  finishListener(resolve: (reason?: any) => void, _reject: (reason?: unknown) => void) {
    resolve({ metadata: this.metadata })
  }
}
