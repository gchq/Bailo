import { castArray } from 'lodash-es'
import { DateString, ModelId } from '../../types/interfaces.js'
import { UserDoc } from '../models/User.js'
import VersionModel, { VersionDoc } from '../models/Version.js'
import Authorisation from '../external/Authorisation.js'
import { asyncFilter } from '../utils/general.js'
import { createSerializer, SerializerOptions } from '../utils/serializers.js'
import { BadReq, Forbidden } from '../utils/result.js'
import { serializedModelFields } from './model.js'

const auth = new Authorisation()

interface GetVersionOptions {
  thin?: boolean
  populate?: boolean
  showLogs?: boolean
}

export function serializedVersionFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'version', 'metadata.highLevelDetails.name'],
    optional: [],
    serializable: [{ type: createSerializer(serializedModelFields()), field: 'model' }],
  }
}

export async function filterVersion<T>(user: UserDoc, unfiltered: T): Promise<T> {
  const versions = castArray(unfiltered)

  const filtered = await asyncFilter(versions, (version: VersionDoc) => auth.canUserSeeVersion(user, version))

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findVersionById(user: UserDoc, id: ModelId, opts?: GetVersionOptions) {
  let version = VersionModel.findById(id)
  if (opts?.thin) version = version.select({ state: 0, metadata: 0 })
  if (!opts?.showLogs) version = version.select({ logs: 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findVersionByName(user: UserDoc, model: ModelId, name: string, opts?: GetVersionOptions) {
  let version = VersionModel.findOne({ model, version: name })
  if (opts?.thin) version = version.select({ state: 0, metadata: 0 })
  if (!opts?.showLogs) version = version.select({ logs: 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findModelVersions(user: UserDoc, model: ModelId, opts?: GetVersionOptions) {
  let versions = VersionModel.find({ model })
  if (opts?.thin) versions = versions.select({ state: 0 })
  if (!opts?.showLogs) versions = versions.select({ logs: 0 })
  if (opts?.populate) versions = versions.populate('model')

  return filterVersion(user, await versions)
}

export async function markVersionBuilt(_id: ModelId) {
  return VersionModel.findByIdAndUpdate(_id, { built: true })
}

export async function markVersionState(user: UserDoc, _id: ModelId, state: string) {
  const version = await findVersionById(user, _id)

  if (!version) {
    throw BadReq({ code: 'model_version_invalid', versionId: _id }, `Provided invalid version '${_id}'`)
  }

  version.state.build = {
    ...(version.state.build || {}),
    state,
  }

  if (state === 'succeeded') {
    version.state.build.reason = undefined
  }

  version.markModified('state')
  await version.save()
}

interface CreateVersion {
  version: string
  metadata: any
  files: any
}

export async function createVersion(user: UserDoc, data: CreateVersion) {
  const version = new VersionModel(data)

  if (!(await auth.canUserSeeVersion(user, version))) {
    throw Forbidden({ data }, 'Unable to create version, failed permissions check.')
  }

  await version.save()

  return version
}

export async function updateManagerLastViewed(id: ModelId) {
  return VersionModel.findOneAndUpdate(
    { _id: id },
    { $set: { managerLastViewed: new Date() as DateString } },
    { timestamps: false }
  )
}

export async function updateReviewerLastViewed(id: ModelId) {
  return VersionModel.findOneAndUpdate(
    { _id: id },
    { $set: { reviewerLastViewed: new Date() as DateString } },
    { timestamps: false }
  )
}
