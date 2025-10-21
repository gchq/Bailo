import { PassThrough, Readable } from 'node:stream'

import { Headers } from 'tar-stream'

import { isBailoError } from '../../../types/error.js'
import { InternalError } from '../../../utils/error.js'

export type BaseMirrorMetadata = {
  sourceModelId: string
  mirroredModelId: string
  exporter: string
}

export abstract class BaseImporter {
  abstract processEntry(entry: Headers, stream: PassThrough | Readable): Promise<void> | void

  protected readonly metadata: BaseMirrorMetadata
  protected readonly logData?: Record<string, unknown>

  constructor(metadata: BaseMirrorMetadata, logData?: Record<string, unknown>) {
    this.metadata = metadata
    this.logData = logData
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
