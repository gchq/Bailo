import { Optional } from 'utility-types'

import { ModelAction, ReleaseAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { FileInterface } from '../../models/v2/File.js'
import { ModelDoc, ModelInterface } from '../../models/v2/Model.js'
import Release, { ImageRef, ReleaseDoc, ReleaseInterface } from '../../models/v2/Release.js'
import { UserDoc } from '../../models/v2/User.js'
import { WebhookEvent } from '../../models/v2/Webhook.js'
import { asyncFilter } from '../../utils/v2/array.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { isMongoServerError } from '../../utils/v2/mongo.js'
import { getFileById } from './file.js'
import log from './log.js'
import { getModelById, getModelCardRevision } from './model.js'
import { listModelImages } from './registry.js'
import { createReleaseReviews } from './review.js'
import { sendWebhooks } from './webhook.js'

async function validateRelease(user: UserDoc, model: ModelDoc, release: ReleaseDoc) {
  if (release.images) {
    const registryImages = await listModelImages(user, release.modelId)

    const initialValue: ImageRef[] = []
    const missingImages = release.images.reduce((acc, releaseImage) => {
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

  if (release.fileIds) {
    for (const fileId of release.fileIds) {
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
}

export type CreateReleaseParams = Optional<
  Pick<
    ReleaseInterface,
    'modelId' | 'modelCardVersion' | 'semver' | 'notes' | 'minor' | 'draft' | 'fileIds' | 'images'
  >,
  'modelCardVersion'
>
export async function createRelease(user: UserDoc, releaseParams: CreateReleaseParams) {
  const model = await getModelById(user, releaseParams.modelId)

  if (releaseParams.modelCardVersion) {
    // Ensure that the requested model card version exists.
    await getModelCardRevision(user, releaseParams.modelId, releaseParams.modelCardVersion)
  } else {
    if (!model.card) {
      throw BadReq('This model does not have a model card associated with it yet.', { modelId: model.id })
    }

    releaseParams.modelCardVersion = model.card?.version
  }

  const release = new Release({
    createdBy: user.dn,
    ...releaseParams,
  })

  await validateRelease(user, model, release)

  if (!(await authorisation.userReleaseAction(user, model, release, ReleaseAction.Create))) {
    throw Forbidden(`You do not have permission to create a release on this model.`, {
      userDn: user.dn,
      modelId: releaseParams.modelId,
    })
  }

  try {
    await release.save()
  } catch (error) {
    if (isMongoServerError(error) && error.code === 11000) {
      throw BadReq(`A release with this semver already exists for this model.`, {
        modelId: releaseParams.modelId,
        semver: releaseParams.semver,
      })
    }

    throw error
  }

  if (!release.minor) {
    try {
      await createReleaseReviews(model, release)
    } catch (error) {
      // Transactions here would solve this issue.
      log.warn('Error when creating Release Review Requests. Approval cannot be given to this release', error)
    }
  }

  sendWebhooks(
    release.modelId,
    WebhookEvent.CreateRelease,
    `Release ${release.semver} has been created for model ${release.modelId}`,
    { release },
  )

  return release
}

export type UpdateReleaseParams = Pick<ReleaseInterface, 'notes' | 'draft' | 'fileIds' | 'images'>
export async function updateRelease(user: UserDoc, modelId: string, semver: string, delta: UpdateReleaseParams) {
  const model = await getModelById(user, modelId)
  const release = await getReleaseBySemver(user, modelId, semver)

  Object.assign(release, delta)
  await validateRelease(user, model, release)

  if (!(await authorisation.userReleaseAction(user, model, release, ReleaseAction.Update))) {
    throw Forbidden(`You do not have permission to create a release on this model.`, {
      userDn: user.dn,
      modelId: modelId,
    })
  }

  const updatedRelease = await Release.findOneAndUpdate({ modelId, semver }, { $set: release })

  if (!updatedRelease) {
    throw NotFound(`The requested release was not found.`, { modelId, semver })
  }

  return updatedRelease
}

export async function getModelReleases(
  user: UserDoc,
  modelId: string,
): Promise<Array<ReleaseDoc & { model: ModelInterface; files: FileInterface[] }>> {
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

export async function removeFileFromReleases(user: UserDoc, model: ModelDoc, fileId: string) {
  const query = {
    modelId: model.id,
    // Match documents where the element exists in the array
    fileIds: fileId,
  }
  const releases = await Release.find(query)

  // This auth section will be greatly simplified when an array of resources can be given to the authorisation check
  const releasesAuthChecks = await Promise.all(
    releases.map(async (release) => ({
      release,
      authorised: await authorisation.userReleaseAction(user, model, release, ReleaseAction.Update),
    })),
  )

  const initialValue: {
    modelId: string
    semver: string
  }[] = []
  const unauthorisedReleases = releasesAuthChecks.reduce((acc, releaseAuth) => {
    if (!releaseAuth.authorised) {
      acc.push({ modelId: releaseAuth.release.modelId, semver: releaseAuth.release.semver })
    }
    return acc
  }, initialValue)
  if (unauthorisedReleases.length > 0) {
    throw Forbidden(`You do not have permission to update these releases.`, {
      releases: unauthorisedReleases,
    })
  }

  const result = await Release.updateMany(query, {
    $pull: { fileIds: fileId },
  })

  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
}
