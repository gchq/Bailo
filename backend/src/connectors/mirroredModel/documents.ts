import { PassThrough } from 'node:stream'
import { json } from 'node:stream/consumers'

import { ObjectId } from 'mongoose'
import prettyBytes from 'pretty-bytes'
import { Headers } from 'tar-stream'

import { ReleaseAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { ScanState } from '../../connectors/fileScanning/Base.js'
import scanners from '../../connectors/fileScanning/index.js'
import { FileWithScanResultsInterface } from '../../models/File.js'
import { ModelDoc } from '../../models/Model.js'
import { ModelCardRevisionDoc } from '../../models/ModelCardRevision.js'
import { ReleaseDoc } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import { getFilesByIds, getTotalFileSize, saveImportedFile } from '../../services/file.js'
import log from '../../services/log.js'
import { parseFile, parseModelCard, parseRelease } from '../../services/mirroredModel/entityParsers.js'
import { addEntryToTarGzUpload, initialiseTarGzUpload } from '../../services/mirroredModel/tarball.js'
import {
  getModelById,
  getModelCardRevisions,
  saveImportedModelCard,
  setLatestImportedModelCard,
} from '../../services/model.js'
import { DistributionPackageName, joinDistributionPackageName } from '../../services/registry.js'
import { getAllFileIds, getReleasesForExport, saveImportedRelease } from '../../services/release.js'
import config from '../../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../../utils/error.js'
import { BaseExporter, BaseImporter, BaseMirrorMetadata, requiresInit } from './base.js'
import { MirrorKind, MirrorKindKeys } from './index.js'

export type DocumentsMirrorMetadata = BaseMirrorMetadata & { importKind: MirrorKindKeys<'Documents'> }
export type MongoDocumentMirrorInformation = {
  metadata: DocumentsMirrorMetadata
  modelCardVersions: ModelCardRevisionDoc['version'][]
  newModelCards: Omit<ModelCardRevisionDoc, '_id'>[]
  releaseSemvers: ReleaseDoc['semver'][]
  newReleases: Omit<ReleaseDoc, '_id'>[]
  fileIds: ObjectId[]
  imageIds: string[]
}

export class DocumentsExporter extends BaseExporter {
  protected readonly semvers: Array<string> = []
  protected releases: ReleaseDoc[] = []
  protected files: FileWithScanResultsInterface[] | undefined

  constructor(
    user: UserInterface,
    model: string | ModelDoc,
    releases?: Array<string> | ReleaseDoc[],
    logData?: Record<string, unknown>,
  ) {
    super(user, model, logData)

    if (releases && releases.length > 0) {
      if (releases.every((release: unknown) => typeof release === 'string')) {
        this.semvers = releases
      } else {
        this.releases = releases
        this.semvers = releases.map((release: ReleaseDoc) => release.semver)
      }
    }
  }

  getReleases() {
    return this.releases
  }

  getFiles() {
    return this.files
  }

  async _init() {
    await super._init()

    if (this.semvers.length > 0) {
      if (this.releases.length === 0) {
        this.releases.push(...(await getReleasesForExport(this.user, this.modelId, this.semvers)))
      }
      await this.checkReleaseFiles()
    }
  }

  protected async checkReleaseFiles() {
    const fileIds = await getAllFileIds(this.modelId, this.semvers)
    this.files = await getFilesByIds(this.user, this.modelId, fileIds)

    // Check the total size of the export if more than one release is being exported
    if (this.semvers.length > 1) {
      if (fileIds.length === 0) {
        return
      }
      const totalFileSize = await getTotalFileSize(fileIds)
      log.debug(
        { modelId: this.modelId, semvers: this.semvers, size: prettyBytes(totalFileSize) },
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
      `${this.modelId}.tar.gz`,
      {
        exporter: this.user.dn,
        sourceModelId: this.modelId,
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
      { user: this.user, modelId: this.modelId, ...this.logData },
      'Adding model card revisions to Tarball file.',
    )
    const cards = await getModelCardRevisions(this.user, this.modelId)
    for (const card of cards) {
      const cardJson = JSON.stringify(card.toJSON())
      await addEntryToTarGzUpload(
        this.tarStream!, // Non-null assertion operator used due to `requiresInit` performing assertion
        { type: 'text', filename: `${card.version}.json`, content: cardJson },
        { modelId: this.modelId, ...this.logData },
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
      { user: this.user, modelId: this.modelId, semvers: this.semvers, ...this.logData },
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
        { modelId: this.modelId, ...this.logData },
      )
    } catch (error: unknown) {
      throw InternalError('Error when generating the tarball file.', {
        error,
        modelId: this.modelId,
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
          { modelId: this.modelId, ...this.logData },
        )
      } catch (error: unknown) {
        throw InternalError('Error when generating the tarball file.', {
          error,
          modelId: this.modelId,
          file,
          ...this.logData,
        })
      }
    }
  }
}

export class DocumentsImporter extends BaseImporter {
  declare protected metadata: DocumentsMirrorMetadata

  protected user: UserInterface

  protected modelCardVersions: number[] = []
  protected releaseSemvers: string[] = []
  protected fileIds: ObjectId[] = []
  protected imageIds: string[] = []
  protected newModelCards: Omit<ModelCardRevisionDoc, '_id'>[] = []
  protected newReleases: Omit<ReleaseDoc, '_id'>[] = []

  protected lazyMirroredModel: ModelDoc | null = null
  protected modelCardRegex = new RegExp(String.raw`^${config.modelMirror.contentDirectory}/[0-9]+\.json$`)
  protected releaseRegex = new RegExp(String.raw`^${config.modelMirror.contentDirectory}/releases\/(.*)\.json$`)
  protected fileRegex = new RegExp(String.raw`^${config.modelMirror.contentDirectory}/files\/(.*)\.json$`)

  constructor(user: UserInterface, metadata: DocumentsMirrorMetadata, logData?: Record<string, unknown>) {
    super(metadata, logData)
    if (this.metadata.importKind !== MirrorKind.Documents) {
      throw InternalError('Cannot parse compressed Documents: incorrect metadata specified.', {
        metadata: this.metadata,
        ...this.logData,
      })
    }
    this.user = user
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    if (entry.type === 'file') {
      // Process file
      const fileContentsJson = await json(stream)
      if (this.modelCardRegex.test(entry.name)) {
        log.debug(
          { name: entry.name, metadata: this.metadata, ...this.logData },
          'Processing compressed file as a Model Card.',
        )
        const modelCard = parseModelCard(fileContentsJson, this.metadata.mirroredModelId, this.metadata.sourceModelId, {
          metadata: this.metadata,
          ...this.logData,
        })
        this.modelCardVersions.push(modelCard.version)
        const savedModelCard = await saveImportedModelCard(modelCard)
        if (savedModelCard) {
          this.newModelCards.push(savedModelCard)
        }
      } else if (this.releaseRegex.test(entry.name)) {
        log.debug(
          { name: entry.name, metadata: this.metadata, ...this.logData },
          'Processing compressed file as a Release.',
        )
        const release = parseRelease(fileContentsJson, this.metadata.mirroredModelId, this.metadata.sourceModelId, {
          metadata: this.metadata,
          ...this.logData,
        })

        // have to authorise per-release due to streaming, rather than do all releases at once
        if (!this.lazyMirroredModel) {
          this.lazyMirroredModel = await getModelById(this.user, this.metadata.mirroredModelId)
        }
        const authResponse = await authorisation.releases(
          this.user,
          this.lazyMirroredModel,
          [release],
          ReleaseAction.Import,
        )
        if (!authResponse[0]?.success) {
          throw Forbidden('Insufficient permissions to import the specified releases.', {
            modelId: this.metadata.mirroredModelId,
            release: release.semver,
            user: this.user,
            metadata: this.metadata,
            ...this.logData,
          })
        }

        for (const image of release.images) {
          this.imageIds.push(
            joinDistributionPackageName({
              domain: image.repository,
              path: image.name,
              tag: image.tag,
            } as DistributionPackageName),
          )
        }
        this.releaseSemvers.push(release.semver)
        const savedRelease = await saveImportedRelease(release)
        if (savedRelease) {
          this.newReleases.push(savedRelease)
        }
      } else if (this.fileRegex.test(entry.name)) {
        log.debug(
          { name: entry.name, metadata: this.metadata, ...this.logData },
          'Processing compressed file as a File.',
        )
        const file = await parseFile(fileContentsJson, this.metadata.mirroredModelId, this.metadata.sourceModelId, {
          metadata: this.metadata,
          ...this.logData,
        })
        this.fileIds.push(file._id)
        await saveImportedFile(file)
      } else {
        throw InternalError('Cannot parse compressed file: unrecognised contents.', {
          metadata: this.metadata,
          ...this.logData,
        })
      }
    } else {
      // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
      log.debug(
        { name: entry.name, type: entry.type, metadata: this.metadata, ...this.logData },
        'Skipping non-file entry.',
      )
    }
  }

  async finishListener(
    resolve: (reason?: MongoDocumentMirrorInformation) => void,
    _reject: (reason?: unknown) => void,
    _logData?: Record<string, unknown>,
  ) {
    log.debug({ metadata: this.metadata, ...this.logData }, 'Completed extracting archive.')

    await setLatestImportedModelCard(this.metadata.mirroredModelId)

    log.info(
      {
        mirroredModelId: this.metadata.mirroredModelId,
        sourceModelId: this.metadata.sourceModelId,
        modelCardVersions: this.modelCardVersions,
        releaseSemvers: this.releaseSemvers,
        fileIds: this.fileIds,
        imageIds: this.imageIds,
        numberOfDocuments: {
          modelCards: this.newModelCards.length,
          releases: this.newReleases.length,
          files: this.fileIds.length,
          images: this.imageIds.length,
        },
        metadata: this.metadata,
        ...this.logData,
      },
      'Finished importing the collection of model documents.',
    )

    resolve({
      metadata: this.metadata,
      modelCardVersions: this.modelCardVersions,
      newModelCards: this.newModelCards,
      releaseSemvers: this.releaseSemvers,
      newReleases: this.newReleases,
      fileIds: this.fileIds,
      imageIds: this.imageIds,
    })
  }
}
