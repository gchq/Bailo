import { basename } from 'path'

import Authorisation from '../connectors/Authorisation.js'
import VersionModel from '../models/Version.js'
import { ModelDoc, ModelId, UserDoc, VersionDoc } from '../types/types.js'
import { FileRef } from '../utils/build/build.js'
import config from '../utils/config.js'
import { asyncFilter } from '../utils/general.js'
import logger from '../utils/logger.js'
import { getClient } from '../utils/minio.js'
import { BadReq, Forbidden, NotFound } from '../utils/result.js'
import { listZipFiles, MinioRandomAccessReader } from '../utils/zip.js'

const auth = new Authorisation()

interface GetVersionOptions {
  thin?: boolean
  populate?: boolean
  showLogs?: boolean
  showFiles?: boolean
}

export async function filterVersionArray(user: UserDoc, unfiltered: Array<VersionDoc>) {
  return asyncFilter(unfiltered, (version: VersionDoc) => auth.canUserSeeVersion(user, version))
}

export async function filterVersion(user: UserDoc, unfiltered: VersionDoc | null) {
  if (!unfiltered) {
    return null
  }

  if (!(await auth.canUserSeeVersion(user, unfiltered))) {
    return null
  }

  return unfiltered
}

export async function findVersionById(user: UserDoc, id: ModelId | VersionDoc, opts?: GetVersionOptions) {
  let version = VersionModel.findById(id)
  if (opts?.thin) version = version.select({ state: 0, metadata: 0 })
  if (!opts?.showLogs) version = version.select({ logs: 0 })
  if (!opts?.showFiles) version = version.select({ 'files.code': 0, 'files.binary': 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findVersionByName(
  user: UserDoc,
  model: ModelId | ModelDoc,
  name: string,
  opts?: GetVersionOptions,
) {
  let version = VersionModel.findOne({ model, version: name })
  if (opts?.thin) version = version.select({ state: 0, metadata: 0 })
  if (!opts?.showLogs) version = version.select({ logs: 0 })
  if (!opts?.showFiles) version = version.select({ 'files.code': 0, 'files.binary': 0 })
  if (opts?.populate) version = version.populate('model')

  return filterVersion(user, await version)
}

export async function findModelVersions(user: UserDoc, model: ModelId, opts?: GetVersionOptions) {
  let versions = VersionModel.find({ model })
  if (opts?.thin) versions = versions.select({ state: 0 })
  if (!opts?.showLogs) versions = versions.select({ logs: 0 })
  if (!opts?.showFiles) versions = versions.select({ 'files.code': 0, 'files.binary': 0 })
  if (opts?.populate) versions = versions.populate('model')

  return filterVersionArray(user, await versions)
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
  model: ModelId
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
  return VersionModel.findOneAndUpdate({ _id: id }, { $set: { managerLastViewed: new Date() } }, { timestamps: false })
}

export async function updateReviewerLastViewed(id: ModelId) {
  return VersionModel.findOneAndUpdate({ _id: id }, { $set: { reviewerLastViewed: new Date() } }, { timestamps: false })
}

export async function findVersionFileList(version: VersionDoc) {
  if (version.files.code?.fileList) {
    return version.files.code.fileList
  }

  logger.trace({ version: version._id }, 'Unable to find cached file list')

  const path = version.files.rawCodePath
  if (!path) {
    throw NotFound({ code: 'version_code_not_found', versionId: version._id }, 'Unable to find version zip file')
  }

  const fileRef: FileRef = {
    bucket: config.minio.buckets.uploads,
    path,
    name: basename(path),
  }

  const minio = getClient()
  const reader = new MinioRandomAccessReader(minio, fileRef)
  const fileList = await listZipFiles(reader)

  // eslint-disable-next-line no-param-reassign
  if (!version.files.code) version.files.code = {}
  // eslint-disable-next-line no-param-reassign
  version.files.code.fileList = fileList
  version.markModified('files')
  await version.save()

  return fileList
}
