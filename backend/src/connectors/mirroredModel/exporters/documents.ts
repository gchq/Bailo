import prettyBytes from 'pretty-bytes'

import { FileWithScanResultsInterface } from '../../../models/File.js'
import { ModelDoc } from '../../../models/Model.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { getFilesByIds, getTotalFileSize } from '../../../services/file.js'
import log from '../../../services/log.js'
import { MirrorLogData } from '../../../services/mirroredModel/mirroredModel.js'
import { addEntryToTarGzUpload, initialiseTarGzUpload } from '../../../services/mirroredModel/tarball.js'
import { getModelCardRevisions } from '../../../services/model.js'
import { getAllFileIds } from '../../../services/release.js'
import config from '../../../utils/config.js'
import { BadReq, InternalError } from '../../../utils/error.js'
import { ScanState } from '../../fileScanning/Base.js'
import scanners from '../../fileScanning/index.js'
import { MirrorKind } from '../index.js'
import { BaseExporter, requiresInit } from './base.js'

export class DocumentsExporter extends BaseExporter {
  protected readonly releases: ReleaseDoc[]
  protected files: FileWithScanResultsInterface[] | undefined

  constructor(user: UserInterface, model: ModelDoc, releases: ReleaseDoc[], logData: MirrorLogData) {
    super(user, model, logData)
    this.releases = releases
  }

  getReleases() {
    return this.releases
  }

  getFiles() {
    return this.files
  }

  protected async _init() {
    await super._init()

    if (this.releases.length > 0) {
      await this.checkReleaseFiles()
    }
  }

  protected getSemvers() {
    return this.releases.map((release) => release.semver)
  }

  protected async checkReleaseFiles() {
    const semvers = this.getSemvers()
    const fileIds = await getAllFileIds(this.model.id, semvers)
    this.files = await getFilesByIds(this.user, this.model.id, fileIds)

    // Check the total size of the export if more than one release is being exported
    if (this.releases.length > 1) {
      if (fileIds.length === 0) {
        return
      }
      const totalFileSize = await getTotalFileSize(fileIds)
      log.debug(
        { modelId: this.model.id, semvers, size: prettyBytes(totalFileSize) },
        'Calculated estimated total file size included in export.',
      )
      if (totalFileSize > config.modelMirror.export.maxSize) {
        throw BadReq('Requested export is too large.', {
          size: totalFileSize,
          maxSize: config.modelMirror.export.maxSize,
        })
      }
    }

    if (scanners.info()) {
      const scanErrors: {
        missingScan: Array<{ name: string; id: string }>
        incompleteScan: Array<{ name: string; id: string }>
        failedScan: Array<{ name: string; id: string }>
      } = { missingScan: [], incompleteScan: [], failedScan: [] }
      for (const file of this.files) {
        if (!file.avScan || file.avScan.length === 0) {
          scanErrors.missingScan.push({ name: file.name, id: file.id })
        } else if (file.avScan.some((scanResult) => scanResult.state !== ScanState.Complete)) {
          scanErrors.incompleteScan.push({ name: file.name, id: file.id })
        } else if (file.avScan.some((scanResult) => scanResult.isInfected)) {
          scanErrors.failedScan.push({ name: file.name, id: file.id })
        }
      }
      if (
        scanErrors.missingScan.length > 0 ||
        scanErrors.incompleteScan.length > 0 ||
        scanErrors.failedScan.length > 0
      ) {
        throw BadReq('The releases contain file(s) that do not have a clean AV scan.', { scanErrors })
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
      `${this.model.id}.tar.gz`,
      {
        schemaVersion: 1,
        exporter: this.user.dn,
        sourceModelId: this.model.id,
        mirroredModelId: this.model!.settings.mirror.destinationModelId!,
        importKind: MirrorKind.Documents,
      },
      this.logData,
    ]
  }

  @requiresInit
  async addData() {
    try {
      await this.addModelCardRevisionsToTarball()
    } catch (error) {
      throw InternalError('Error when adding the model card revision(s) to the Tarball file.', {
        error,
        ...this.logData,
      })
    }

    try {
      if (this.releases.length > 0) {
        await this.addReleasesToTarball()
      }
    } catch (error) {
      throw InternalError('Error when adding the release(s) to the Tarball file.', { error, ...this.logData })
    }
  }

  @requiresInit
  protected async addModelCardRevisionsToTarball() {
    log.debug(
      { user: this.user, modelId: this.model.id, ...this.logData },
      'Adding model card revisions to Tarball file.',
    )
    const cards = await getModelCardRevisions(this.user, this.model.id)
    for (const card of cards) {
      const cardJson = JSON.stringify(card.toJSON())
      await addEntryToTarGzUpload(
        this.tarStream!, // Non-null assertion operator used due to `requiresInit` performing assertion
        { type: 'text', filename: `${card.version}.json`, content: cardJson },
        { modelId: this.model.id, ...this.logData },
      )
    }
    log.debug(
      { modelCards: cards.map((card) => card.version), ...this.logData },
      'Completed adding model card revisions to Tarball file.',
    )
  }

  @requiresInit
  protected async addReleasesToTarball() {
    log.debug({ ...this.logData }, 'Adding model releases to Tarball file.')

    const errors: any[] = []
    // Using a .catch here to ensure all errors are returned, rather than just the first error.
    await Promise.all(this.releases.map((release) => this.addReleaseToTarball(release).catch((e) => errors.push(e))))
    if (errors.length > 0) {
      throw InternalError('Error when adding release(s) to Tarball file.', { errors, ...this.logData })
    }
    log.debug(
      { user: this.user, modelId: this.model.id, semvers: this.getSemvers(), ...this.logData },
      'Completed adding model releases to Tarball file.',
    )
  }

  @requiresInit
  protected async addReleaseToTarball(release: ReleaseDoc) {
    log.debug({ semver: release.semver, ...this.logData }, 'Adding release to tarball file of releases.')
    const files: FileWithScanResultsInterface[] = await getFilesByIds(this.user, release.modelId, release.fileIds)

    try {
      const releaseJson = JSON.stringify(release.toJSON())
      await addEntryToTarGzUpload(
        this.tarStream!,
        { type: 'text', filename: `releases/${release.semver}.json`, content: releaseJson },
        { modelId: this.model.id, ...this.logData },
      )
    } catch (error: unknown) {
      throw InternalError('Error when generating the tarball file.', {
        error,
        modelId: this.model.id,
        mirroredModelId: this.model!.settings.mirror.destinationModelId!,
        releaseId: release.id,
        ...this.logData,
      })
    }

    if (files.length > 0) {
      await this.addFilesToTarball(files)
    }
  }

  @requiresInit
  protected async addFilesToTarball(files: FileWithScanResultsInterface[]) {
    for (const file of files) {
      try {
        const fileJson = JSON.stringify(file)
        await addEntryToTarGzUpload(
          this.tarStream!,
          { type: 'text', filename: `files/${file._id.toString()}.json`, content: fileJson },
          { modelId: this.model.id, ...this.logData },
        )
      } catch (error: unknown) {
        throw InternalError('Error when generating the tarball file.', {
          error,
          modelId: this.model.id,
          file,
          ...this.logData,
        })
      }
    }
  }
}
