import { json } from 'node:stream/consumers'

import { ObjectId } from 'mongoose'
import { Readable } from 'stream'

import { ReleaseAction } from '../../../connectors/authorisation/actions.js'
import authorisation from '../../../connectors/authorisation/index.js'
import { ModelDoc } from '../../../models/Model.js'
import { ModelCardRevisionDoc } from '../../../models/ModelCardRevision.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { Forbidden, InternalError } from '../../../utils/error.js'
import { extractTarGzStream } from '../../../utils/tarball.js'
import { saveImportedFile } from '../../file.js'
import log from '../../log.js'
import { getModelById, saveImportedModelCard, setLatestImportedModelCard } from '../../model.js'
import { DistributionPackageName, joinDistributionPackageName } from '../../registry.js'
import { saveImportedRelease } from '../../release.js'
import { parseFile, parseModelCard, parseRelease } from '../parsers/modelParser.js'

const modelCardRegex = /^[0-9]+\.json$/
const releaseRegex = /^releases\/(.*)\.json$/
const fileRegex = /^files\/(.*)\.json$/

export async function importDocuments(
  user: UserInterface,
  body: Readable,
  mirroredModelId: string,
  sourceModelId: string,
  payloadUrl: string,
  importId: string,
) {
  const modelCardVersions: number[] = []
  const releaseSemvers: string[] = []
  const fileIds: ObjectId[] = []
  const imageIds: string[] = []
  const newModelCards: Omit<ModelCardRevisionDoc, '_id'>[] = []
  const newReleases: Omit<ReleaseDoc, '_id'>[] = []

  // enable lazy fetching
  let lazyMirroredModel: ModelDoc | null = null
  await extractTarGzStream(body, async function (entry, stream, next) {
    log.debug(
      {
        name: entry.name,
        type: entry.type,
        size: entry.size,
        importId,
      },
      'Processing un-tarred entry',
    )

    if (entry.type === 'file') {
      // Process file
      const fileContentsJson = await json(stream)

      if (modelCardRegex.test(entry.name)) {
        log.debug({ name: entry.name, importId }, 'Processing compressed file as a Model Card')
        const modelCard = parseModelCard(fileContentsJson, mirroredModelId, sourceModelId, importId)
        modelCardVersions.push(modelCard.version)
        const savedModelCard = await saveImportedModelCard(modelCard)
        if (savedModelCard) {
          newModelCards.push(savedModelCard)
        }
      } else if (releaseRegex.test(entry.name)) {
        log.debug({ name: entry.name, importId }, 'Processing compressed file as a Release')
        const release = parseRelease(fileContentsJson, mirroredModelId, sourceModelId, importId)

        // have to authorise per-release due to streaming, rather than do all releases at once
        if (!lazyMirroredModel) {
          lazyMirroredModel = await getModelById(user, mirroredModelId)
        }
        const authResponse = await authorisation.releases(user, lazyMirroredModel, [release], ReleaseAction.Import)
        if (!authResponse[0]?.success) {
          throw Forbidden('Insufficient permissions to import the specified releases.', {
            modelId: mirroredModelId,
            release: release.semver,
            user,
            importId,
          })
        }

        for (const image of release.images) {
          imageIds.push(
            joinDistributionPackageName({
              domain: image.repository,
              path: image.name,
              tag: image.tag,
            } as DistributionPackageName),
          )
        }
        releaseSemvers.push(release.semver)
        const savedRelease = await saveImportedRelease(release)
        if (savedRelease) {
          newReleases.push(savedRelease)
        }
      } else if (fileRegex.test(entry.name)) {
        log.debug({ name: entry.name, importId }, 'Processing compressed file as a File')
        const file = await parseFile(fileContentsJson, mirroredModelId, sourceModelId, importId)
        fileIds.push(file._id)
        await saveImportedFile(file)
      } else {
        throw InternalError('Cannot parse compressed file: unrecognised contents.', {
          mirroredModelId,
          importId,
        })
      }
    } else {
      // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
      log.warn({ name: entry.name, type: entry.type, importId }, 'Skipping non-file entry')
    }
    next()
  })
  log.debug({ importId }, 'Completed extracting archive')

  const updatedMirroredModel = await setLatestImportedModelCard(mirroredModelId)

  log.info(
    {
      mirroredModelId,
      payloadUrl,
      sourceModelId,
      modelCardVersions,
      releaseSemvers,
      fileIds,
      imageIds,
      numberOfDocuments: {
        modelCards: newModelCards.length,
        releases: newReleases.length,
        files: fileIds.length,
        images: imageIds.length,
      },
      importId,
    },
    'Finished importing the collection of model documents.',
  )

  return {
    mirroredModel: updatedMirroredModel,
    importResult: {
      modelCardVersions,
      newModelCards,
      releaseSemvers,
      newReleases,
      fileIds,
      imageIds,
    },
  }
}
