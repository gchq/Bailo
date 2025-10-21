import { Readable } from 'node:stream'

import { FileWithScanResultsInterface } from '../../../models/File.js'
import { ModelDoc } from '../../../models/Model.js'
import { UserInterface } from '../../../models/User.js'
import { downloadFile, getFileById } from '../../../services/file.js'
import { addEntryToTarGzUpload, initialiseTarGzUpload } from '../../../services/mirroredModel/tarball.js'
import config from '../../../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../../../utils/error.js'
import { FileAction } from '../../authorisation/actions.js'
import authorisation from '../../authorisation/index.js'
import { ScanState } from '../../fileScanning/Base.js'
import scanners from '../../fileScanning/index.js'
import { MirrorKind } from '../index.js'
import { BaseExporter, requiresInit } from './base.js'

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
