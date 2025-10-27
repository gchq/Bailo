import { Readable } from 'node:stream'

import { FileAction } from '../../../connectors/authorisation/actions.js'
import authorisation from '../../../connectors/authorisation/index.js'
import { ScanState } from '../../../connectors/fileScanning/Base.js'
import scanners from '../../../connectors/fileScanning/index.js'
import { FileWithScanResultsInterface } from '../../../models/File.js'
import { ModelDoc } from '../../../models/Model.js'
import { UserInterface } from '../../../models/User.js'
import config from '../../../utils/config.js'
import { BadReq, Forbidden } from '../../../utils/error.js'
import { downloadFile } from '../../file.js'
import { MirrorKind, MirrorLogData } from '../mirroredModel.js'
import { addEntryToTarGzUpload, initialiseTarGzUpload } from '../tarball.js'
import { BaseExporter } from './base.js'

export class FileExporter extends BaseExporter {
  protected readonly file: FileWithScanResultsInterface

  constructor(user: UserInterface, model: ModelDoc, file: FileWithScanResultsInterface, logData: MirrorLogData) {
    super(user, model, logData)
    this.file = file
  }

  getFile() {
    return this.file
  }

  protected _init() {
    if (this.file.size > config.modelMirror.export.maxSize) {
      throw BadReq('Requested export is too large.', {
        size: this.file.size,
        maxSize: config.modelMirror.export.maxSize,
      })
    }

    if (scanners.info()) {
      if (!this.file.avScan || this.file.avScan.length === 0) {
        throw BadReq('The file is missing AV scan(s).', { filename: this.file.name, fileId: this.file.id })
      } else if (this.file.avScan.some((scanResult) => scanResult.state !== ScanState.Complete)) {
        throw BadReq('The file has incomplete AV scan(s).', { filename: this.file.name, fileId: this.file.id })
      } else if (this.file.avScan.some((scanResult) => scanResult.isInfected)) {
        throw BadReq('The file has failed AV scan(s).', { filename: this.file.name, fileId: this.file.id })
      }
    }
  }

  protected async _checkAuths() {
    const fileAuth = await authorisation.file(this.user, this.model!, this.file, FileAction.Download)
    if (!fileAuth.success) {
      throw Forbidden(fileAuth.info, {
        userDn: this.user.dn,
        modelId: this.model.id,
        fileId: this.file.id,
        ...this.logData,
      })
    }
  }

  protected getInitialiseTarGzUploadParams(): Parameters<typeof initialiseTarGzUpload> {
    return [
      `${this.file.id}.tar.gz`,
      {
        schemaVersion: 1,
        exporter: this.user.dn,
        sourceModelId: this.model.id,
        mirroredModelId: this.model.settings.mirror.destinationModelId!,
        filePath: this.file.id,
        importKind: MirrorKind.File,
      },
      this.logData,
    ]
  }

  protected async _addData() {
    await addEntryToTarGzUpload(
      this.tarStream!,
      {
        type: 'stream',
        filename: this.file.id,
        stream: (await downloadFile(this.user, this.file.id)).Body as Readable,
        size: this.file.size,
      },
      this.logData,
    )
  }
}
