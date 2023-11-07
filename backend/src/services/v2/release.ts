import { ModelAction, ReleaseAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { ModelInterface } from '../../models/v2/Model.js'
import Release, { ImageRef, ReleaseDoc, ReleaseInterface } from '../../models/v2/Release.js'
import { UserDoc } from '../../models/v2/User.js'
import { asyncFilter } from '../../utils/v2/array.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { handleDuplicateKeys } from '../../utils/v2/mongo.js'
import { getFileById } from './file.js'
import log from './log.js'
import { getModelById } from './model.js'
import { listModelImages } from './registry.js'
import { createReleaseReviews } from './review.js'

export type CreateReleaseParams = Pick<
  ReleaseInterface,
  'modelId' | 'modelCardVersion' | 'semver' | 'notes' | 'minor' | 'draft' | 'fileIds' | 'images'
>
export async function createRelease(user: UserDoc, releaseParams: CreateReleaseParams) {
  if (releaseParams.images) {
    const registryImages = await listModelImages(user, releaseParams.modelId)

    const initialValue: ImageRef[] = []
    const missingImages = releaseParams.images.reduce((acc, releaseImage) => {
      if (
        !registryImages.some(
          (registryImage) =>
            releaseImage.name === registryImage.name &&
            releaseImage.repository === registryImage.repository &&
            registryImage.tags.includes(releaseImage.tag),
        )
      ) {
        acc.push(releaseImage)
      }
      return acc
    }, initialValue)

    if (missingImages.length > 0) {
      throw BadReq('The following images do not exist in the registry.', {
        missingImages,
      })
    }
  }

  const model = await getModelById(user, releaseParams.modelId)

  if (releaseParams.fileIds) {
    for (const fileId of releaseParams.fileIds) {
      const file = await getFileById(user, fileId)

      if (file.modelId !== model.id) {
        throw BadReq(
          `The file '${fileId}' comes from the model '${file.modelId}', but this release is being created for '${model.id}'`,
          {
            modelId: model.id,
            fileId: fileId,
            fileModelId: file.modelId,
          },
        )
      }
    }
  }

  const release = new Release({
    createdBy: user.dn,
    ...releaseParams,
  })

  if (!(await authorisation.userReleaseAction(user, model, release, ReleaseAction.Create))) {
    throw Forbidden(`You do not have permission to create a release on this model.`, {
      userDn: user.dn,
      modelId: releaseParams.modelId,
    })
  }

  try {
    await release.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }

  try {
    await createReleaseReviews(model, release)
  } catch (error) {
    // Transactions here would solve this issue.
    log.warn('Error when creating Release Review Requests. Approval cannot be given to this release', error)
  }

  return release
}

export async function getModelReleases(
  user: UserDoc,
  modelId: string,
): Promise<Array<ReleaseDoc & { model: ModelInterface }>> {
  const results = await Release.aggregate()
    .match({ modelId })
    .sort({ updatedAt: -1 })
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    .append({ $set: { model: { $arrayElemAt: ['$model', 0] } } })
    .lookup({ from: 'v2_files', localField: 'fileIds', foreignField: '_id', as: 'files' })

  return asyncFilter(results, (result) => authorisation.userReleaseAction(user, result.model, result, ModelAction.View))
}

export async function getReleaseBySemver(user: UserDoc, modelId: string, semver: string) {
  const model = await getModelById(user, modelId)
  const release = await Release.findOne({
    modelId,
    semver,
  })

  if (!release) {
    throw NotFound(`The requested release was not found.`, { modelId, semver })
  }

  if (!(await authorisation.userReleaseAction(user, model, release, ReleaseAction.View))) {
    throw Forbidden(`You do not have permission to view this release.`, { userDn: user.dn })
  }

  return release
}

export async function deleteRelease(user: UserDoc, modelId: string, semver: string) {
  const model = await getModelById(user, modelId)
  const release = await getReleaseBySemver(user, modelId, semver)

  if (!(await authorisation.userReleaseAction(user, model, release, ReleaseAction.Delete))) {
    throw Forbidden(`You do not have permission to delete this release.`, { userDn: user.dn })
  }

  await release.delete()

  return { modelId, semver }
}

export function getReleaseName(release: ReleaseDoc): string {
  return `${release.modelId} - v${release.semver}`
}
