import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'

import { InternalError } from '../../../utils/error.js'
import { ExportMetadata } from '../mirroredModel.js'

export abstract class BaseImporter {
  abstract processEntry(entry: Headers, stream: PassThrough): Promise<void> | void

  metadata: ExportMetadata
  logData?: Record<string, unknown>

  constructor(metadata: ExportMetadata, logData?: Record<string, unknown>) {
    this.metadata = metadata
    this.logData = logData
  }

  // use `any` as "real" types are not a subtype `unknown`
  errorListener(error: unknown, _resolve: (reason?: any) => void, reject: (reason?: unknown) => void) {
    reject(
      InternalError('Error processing tarball during import.', { error, metadata: this.metadata, ...this.logData }),
    )
  }

  // use `any` as "real" types are not a subtype `unknown`
  finishListener(resolve: (reason?: any) => void, _reject: (reason?: unknown) => void) {
    resolve(this.metadata)
  }
}
