import { castArray } from 'lodash'
import { ModelId } from '../../types/interfaces'
import { UserDoc } from '../models/User'
import VersionModel, { VersionDoc } from '../models/Version'
import AuthorisationBase from '../utils/AuthorisationBase'
import { asyncFilter } from '../utils/general'
import { createSerializer, SerializerOptions } from '../utils/logger'
import { BadReq, Forbidden } from '../utils/result'
import { serializedModelFields } from './model'

const authorisation = new AuthorisationBase()

interface GetVersionOptions {
  thin?: boolean
  populate?: boolean
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

  const filtered = await asyncFilter(versions, (version: VersionDoc) => authorisation.canUserSeeVersion(user, version))

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findVersionById(user: UserDoc, id: ModelId, opts?: GetVersionOptions) {
  let version = VersionModel.findById(id)
  if (opts?.thin) version = version.select({ state: 0, logs: 0, metadata: 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findVersionByName(user: UserDoc, model: ModelId, name: string, opts?: GetVersionOptions) {
  let version = VersionModel.findOne({ model, version: name })
  if (opts?.thin) version = version.select({ state: 0, logs: 0, metadata: 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findModelVersions(user: UserDoc, model: ModelId, opts?: GetVersionOptions) {
  let versions = VersionModel.find({ model })
  if (opts?.thin) versions = versions.select({ state: 0, logs: 0 })
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

  if (!(await authorisation.canUserSeeVersion(user, version))) {
    throw Forbidden({ data }, 'Unable to create version, failed permissions check.')
  }

  await version.save()

  return version
}
