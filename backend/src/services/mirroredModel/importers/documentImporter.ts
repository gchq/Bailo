import { PassThrough } from 'node:stream'
import { json } from 'node:stream/consumers'

import { ObjectId } from 'mongoose'
import { Headers } from 'tar-stream'

import { ReleaseAction } from '../../../connectors/authorisation/actions.js'
import authorisation from '../../../connectors/authorisation/index.js'
import { ModelDoc } from '../../../models/Model.js'
import { ModelCardRevisionDoc } from '../../../models/ModelCardRevision.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { Forbidden, InternalError } from '../../../utils/error.js'
import { saveImportedFile } from '../../file.js'
import log from '../../log.js'
import { getModelById, saveImportedModelCard, setLatestImportedModelCard } from '../../model.js'
import { DistributionPackageName, joinDistributionPackageName } from '../../registry.js'
import { saveImportedRelease } from '../../release.js'
import { DocumentsExportMetadata, ImportKind, MongoDocumentImportInformation } from '../mirroredModel.js'
import { parseFile, parseModelCard, parseRelease } from '../parsers/modelParser.js'
import { BaseImporter } from './baseImporter.js'

const modelCardRegex = /^[0-9]+\.json$/
const releaseRegex = /^releases\/(.*)\.json$/
const fileRegex = /^files\/(.*)\.json$/

export class DocumentsImporter extends BaseImporter {
  declare metadata: DocumentsExportMetadata

  user: UserInterface

  modelCardVersions: number[] = []
  releaseSemvers: string[] = []
  fileIds: ObjectId[] = []
  imageIds: string[] = []
  newModelCards: Omit<ModelCardRevisionDoc, '_id'>[] = []
  newReleases: Omit<ReleaseDoc, '_id'>[] = []

  lazyMirroredModel: ModelDoc | null = null

  constructor(user: UserInterface, metadata: DocumentsExportMetadata, logData?: Record<string, unknown>) {
    super(metadata, logData)
    if (this.metadata.importKind !== ImportKind.Documents) {
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
      if (modelCardRegex.test(entry.name)) {
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
      } else if (releaseRegex.test(entry.name)) {
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
      } else if (fileRegex.test(entry.name)) {
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
    resolve: (reason?: MongoDocumentImportInformation) => void,
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
