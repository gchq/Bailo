import { PassThrough, Readable } from 'node:stream'

import { Headers } from 'tar-stream'

import { isBailoError } from '../../../types/error.js'
import { MirrorImportLogData } from '../../../types/types.js'
import { InternalError } from '../../../utils/error.js'
import log from '../../log.js'

export type BaseMirrorMetadata = {
  schemaVersion: number
  sourceModelId: string
  mirroredModelId: string
  exporter: string
  exportId: string
}

/**
 * Abstract base class for all mirrored model importers.
 *
 * Responsibilities:
 * - Holds import metadata (`BaseMirrorMetadata`) and structured logging data (`MirrorLogData`).
 * - Defines an abstract contract for processing incoming tar stream entries.
 * - Provides generic error and finish listeners for import stream handling.
 *
 * Subclasses should implement `processEntry()` to handle each file entry in the tarball stream.
 */
export abstract class BaseImporter {
  /**
   * Process a single entry from the tarball stream.
   *
   * @param entry - Tarball entry headers (metadata about the file within the archive).
   * @param stream - Stream containing the entry's data payload.
   *                 May be a `PassThrough` or `Readable` instance depending on tar-stream operation.
   * @returns A promise (or void) indicating completion of entry processing.
   */
  abstract processEntry(entry: Headers, stream: PassThrough | Readable): Promise<void> | void

  protected readonly metadata: BaseMirrorMetadata
  protected readonly logData: MirrorImportLogData

  /**
   * Creates a new importer instance.
   *
   * @param metadata - Base mirror metadata describing the import's source and format.
   * @param logData - Additional logging context for traceability and debugging.
   */
  constructor(metadata: BaseMirrorMetadata, logData: MirrorImportLogData) {
    this.metadata = metadata
    this.logData = { importerType: this.constructor.name, ...logData }

    log.trace({ metadata: this.metadata, ...this.logData }, `Constructed new ${this.constructor.name}.`)
  }

  getMetadata(): BaseMirrorMetadata {
    return this.metadata
  }

  /**
   * Generic error handler for tarball import stream operations.
   *
   * - If the error is a BailoError, it is propagated directly via `reject()`.
   * - Otherwise wraps the error into an `InternalError` including metadata and log context before rejecting.
   *
   * @param error - The error thrown during tarball processing.
   * @param _resolve - **Unused** in error path; present for stream API compatibility.
   * @param reject - Stream promise rejection callback.
   *
   * @remarks
   * The type parameters use `any` due to Node.js stream callback API constraints — actual implementations
   * may use more specific types but are not subtypes of `unknown`.
   */
  handleStreamError(error: unknown, _resolve: (reason?: any) => void, reject: (reason?: unknown) => void): void {
    if (isBailoError(error)) {
      reject(error)
    } else {
      reject(
        InternalError('Error processing tarball during import.', { error, metadata: this.metadata, ...this.logData }),
      )
    }
  }

  /**
   * Generic completion handler for tarball import stream operations.
   * Resolves the stream promise with the import metadata object.
   *
   * @param resolve - Stream promise resolution callback.
   * @param _reject - **Unused** in success path; present for stream API compatibility.
   * @remarks
   * The type parameters use `any` due to Node.js stream callback API constraints.
   */
  handleStreamCompletion(resolve: (reason?: any) => void, _reject: (reason?: unknown) => void): void {
    resolve({ metadata: this.metadata })
  }
}
