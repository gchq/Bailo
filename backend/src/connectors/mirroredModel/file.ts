import { PassThrough, Readable } from 'node:stream'

import { Headers } from 'tar-stream'

import { putObjectStream } from '../../clients/s3.js'
import { ScanState } from '../../connectors/fileScanning/Base.js'
import scanners from '../../connectors/fileScanning/index.js'
import FileModel, { FileWithScanResultsInterface } from '../../models/File.js'
import { ModelDoc } from '../../models/Model.js'
import { UserInterface } from '../../models/User.js'
import { createFilePath, downloadFile, getFileById, markFileAsCompleteAfterImport } from '../../services/file.js'
import log from '../../services/log.js'
import { addEntryToTarGzUpload, initialiseTarGzUpload } from '../../services/mirroredModel/tarball.js'
import config from '../../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../../utils/error.js'
import { FileAction } from '../authorisation/actions.js'
import authorisation from '../authorisation/index.js'
import { BaseExporter, BaseImporter, BaseMirrorMetadata, requiresInit } from './base.js'
import { MirrorKind, MirrorKindKeys } from './index.js'

export type FileMirrorMetadata = BaseMirrorMetadata & { importKind: MirrorKindKeys<'File'>; filePath: string }
export type FileMirrorInformation = {
  metadata: FileMirrorMetadata
  sourcePath: string
  newPath: string
}

export class FileExporter extends BaseExporter {
  protected readonly fileId: string
  protected file: FileWithScanResultsInterface | undefined

  constructor(
    user: UserInterface,
    model: string | ModelDoc,
    file: string | FileWithScanResultsInterface,
    logData?: Record<string, unknown>,
  ) {
    super(user, model, logData)

    if (typeof file === 'string') {
      this.fileId = file
    } else {
      this.file = file
      this.fileId = this.file.id
    }
  }

  getFile() {
    return this.file
  }

  async _init() {
    await super._init()

    if (!this.file) {
      this.file = await getFileById(this.user, this.fileId, this.model)
    }
    const fileAuth = await authorisation.file(this.user, this.model!, this.file, FileAction.Download)
    if (!fileAuth.success) {
      throw Forbidden(fileAuth.info, {
        userDn: this.user.dn,
        modelId: this.modelId,
        fileId: this.fileId,
        ...this.logData,
      })
    }

    if (this.file.size > config.modelMirror.export.maxSize) {
      throw BadReq('Requested export is too large.', {
        size: this.file.size,
        maxSize: config.modelMirror.export.maxSize,
      })
    }

    if (scanners.info()) {
      if (!this.file.avScan || this.file.avScan.length === 0) {
        throw BadReq('The file is missing AV scan(s).', { filename: this.file.name, fileId: this.fileId })
      } else if (this.file.avScan.some((scanResult) => scanResult.state !== ScanState.Complete)) {
        throw BadReq('The file has incomplete AV scan(s).', { filename: this.file.name, fileId: this.fileId })
      } else if (this.file.avScan.some((scanResult) => scanResult.isInfected)) {
        throw BadReq('The file has failed AV scan(s).', { filename: this.file.name, fileId: this.fileId })
      }
    }
  }

  protected getInitialiseTarGzUploadParams(): Parameters<typeof initialiseTarGzUpload> {
    if (!this.model) {
      throw InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        ...this.logData,
      })
    }
    return [
      `${this.fileId}.tar.gz`,
      {
        exporter: this.user.dn,
        sourceModelId: this.modelId,
        mirroredModelId: this.model.settings.mirror.destinationModelId!,
        filePath: this.fileId,
        importKind: MirrorKind.File,
      },
      this.logData,
    ]
  }

  @requiresInit
  async addData() {
    // Non-null assertion operator used due to `requiresInit` performing assertion
    await addEntryToTarGzUpload(
      this.tarStream!,
      {
        type: 'stream',
        filename: this.fileId,
        stream: (await downloadFile(this.user, this.fileId)).Body as Readable,
        size: this.file!.size,
      },
      this.logData,
    )
  }
}

export class FileImporter extends BaseImporter {
  declare protected metadata: FileMirrorMetadata

  protected bucket: string
  protected updatedPath: string
  protected extractedFile: boolean = false

  constructor(metadata: FileMirrorMetadata, logData?: Record<string, unknown>) {
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
    super.finishListener(resolve, _reject)
  }
}
