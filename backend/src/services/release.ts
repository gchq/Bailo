import semver from 'semver'
import { Optional } from 'utility-types'

import { ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterface } from '../models/File.js'
import { ModelDoc, ModelInterface } from '../models/Model.js'
import Release, { ImageRef, ReleaseDoc, ReleaseInterface } from '../models/Release.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { isBailoError } from '../types/error.js'
import { findDuplicates } from '../utils/array.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { isMongoServerError } from '../utils/mongo.js'
import { getFileById, getFilesByIds } from './file.js'
import log from './log.js'
import { getModelById, getModelCardRevision } from './model.js'
import { listModelImages } from './registry.js'
import { createReleaseReviews } from './review.js'
import { sendWebhooks } from './webhook.js'

async function validateRelease(user: UserInterface, model: ModelDoc, release: ReleaseDoc) {
  if (!semver.valid(release.semver)) {
    throw BadReq(`The version '${release.semver}' is not a valid semver value.`)
  }

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
    const fileNames: Array<string> = []

    for (const fileId of release.fileIds) {
      let file
      try {
        file = await getFileById(user, fileId)
      } catch (e) {
        if (isBailoError(e) && e.code === 404) {
          throw BadReq('Unable to create release as the file cannot be found.', { fileId })
        }
        throw e
      }
      fileNames.push(file.name)

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

    const uniqueDuplicates = [...new Set(findDuplicates(fileNames))]
    if (uniqueDuplicates.length) {
      throw BadReq(
        `Releases cannot have multiple files with the same name.  The duplicates in this file are: '${JSON.stringify(
          uniqueDuplicates,
        )}'`,
        {
          fileNames,
          duplicates: uniqueDuplicates,
        },
      )
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
export async function createRelease(user: UserInterface, releaseParams: CreateReleaseParams) {
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

  // There is a typing error whereby mongoose-delete plugin functions are not
  // found by the TS compiler.
  const ReleaseModelWithDelete = Release as any
  const deletedRelease = await ReleaseModelWithDelete.findOneWithDeleted({
    modelId: releaseParams.modelId,
    semver: releaseParams.semver,
  })
  if (deletedRelease) {
    throw BadReq(
      'A release using this semver has been deleted. Please use a different semver or contact an admin to restore the deleted release.',
    )
  }

  const release = new Release({
    createdBy: user.dn,
    ...releaseParams,
  })

  await validateRelease(user, model, release)

  const auth = await authorisation.release(user, model, release, ReleaseAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
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
export async function updateRelease(user: UserInterface, modelId: string, semver: string, delta: UpdateReleaseParams) {
  const model = await getModelById(user, modelId)
  const release = await getReleaseBySemver(user, modelId, semver)

  Object.assign(release, delta)
  await validateRelease(user, model, release)

  const auth = await authorisation.release(user, model, release, ReleaseAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, {
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

export async function newReleaseComment(user: UserInterface, modelId: string, semver: string, message: string) {
  const release = await getReleaseBySemver(user, modelId, semver)

  if (!release) {
    throw NotFound(`The requested release was not found.`, { modelId, semver })
  }

  const comment = {
    message,
    user: user.dn,
    createdAt: new Date().toISOString(),
  }

  const updatedRelease = await Release.findOneAndUpdate(
    { _id: release._id },
    {
      $push: {
        comments: comment,
      },
    },
  )

  if (!updatedRelease) {
    throw InternalError(`Update of release failed.`, { modelId, semver })
  }

  return updatedRelease
}

export async function getModelReleases(
  user: UserInterface,
  modelId: string,
): Promise<Array<ReleaseDoc & { model: ModelInterface; files: FileInterface[] }>> {
  const results = await Release.aggregate()
    .match({ modelId })
    .sort({ updatedAt: -1 })
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    .append({ $set: { model: { $arrayElemAt: ['$model', 0] } } })
    .lookup({ from: 'v2_files', localField: 'fileIds', foreignField: '_id', as: 'files' })

  const model = await getModelById(user, modelId)

  const auths = await authorisation.releases(user, model, results, ReleaseAction.View)
  return results.filter((_, i) => auths[i].success)
}

export async function getReleaseBySemver(user: UserInterface, modelId: string, semver: string) {
  const model = await getModelById(user, modelId)
  const release = await Release.findOne({
    modelId,
    semver,
  })

  if (!release) {
    throw NotFound(`The requested release was not found.`, { modelId, semver })
  }

  const auth = await authorisation.release(user, model, release, ReleaseAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, release: release._id })
  }

  return release
}

export async function deleteRelease(user: UserInterface, modelId: string, semver: string) {
  const model = await getModelById(user, modelId)
  const release = await getReleaseBySemver(user, modelId, semver)

  const auth = await authorisation.release(user, model, release, ReleaseAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, release: release._id })
  }

  await release.delete()

  return { modelId, semver }
}

export function getReleaseName(release: ReleaseDoc): string {
  return `${release.modelId} - v${release.semver}`
}

export async function removeFileFromReleases(user: UserInterface, model: ModelDoc, fileId: string) {
  const query = {
    modelId: model.id,
    // Match documents where the element exists in the array
    fileIds: fileId,
  }
  const releases = await Release.find(query)

  const responses = await authorisation.releases(user, model, releases, ReleaseAction.Update)
  const failures = responses.filter((response) => !response.success)

  if (failures.length) {
    throw Forbidden(`You do not have permission to update these releases.`, {
      releases: failures.map((failure) => failure.id),
    })
  }

  const result = await Release.updateMany(query, {
    $pull: { fileIds: fileId },
  })

  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
}

export async function getFileByReleaseFileName(user: UserInterface, modelId: string, semver: string, fileName: string) {
  const release = await getReleaseBySemver(user, modelId, semver)
  const files = await getFilesByIds(user, modelId, release.fileIds)

  const file = files.find((file) => file.name === fileName)

  if (!file) {
    throw NotFound(`The requested filename was not found on the release.`, { modelId, semver, fileName })
  }

  return file
}
