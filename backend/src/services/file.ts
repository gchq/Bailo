import { Schema } from 'mongoose'
import { Readable } from 'stream'

import { getObjectStream, putObjectStream } from '../clients/s3.js'
import { FileAction, ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileScanResult } from '../connectors/fileScanning/Base.js'
import scanners from '../connectors/fileScanning/index.js'
import FileModel, { ScanState } from '../models/File.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { longId } from '../utils/id.js'
import { getModelById } from './model.js'
import { removeFileFromReleases } from './release.js'

export async function uploadFile(user: UserInterface, modelId: string, name: string, mime: string, stream: Readable) {
  const model = await getModelById(user, modelId)
  if (model.settings.mirror.sourceModelId) {
    throw BadReq(`Cannot upload files to a mirrored model.`)
  }

  const fileId = longId()

  const bucket = config.s3.buckets.uploads
  const path = `beta/model/${modelId}/files/${fileId}`

  const file = new FileModel({ modelId, name, mime, bucket, path, complete: true })

  const auth = await authorisation.file(user, model, file, FileAction.Upload)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId: file._id })
  }

  const { fileSize } = await putObjectStream(bucket, path, stream)
  if (fileSize === 0) {
    throw BadReq(`Could not upload ${file.name} as it is an empty file.`, { file: file })
  }
  file.size = fileSize

  await file.save()

  if (scanners.info() && fileSize > 0) {
    const resultsInprogress: FileScanResult[] = scanners.info().map((scannerName) => ({
      toolName: scannerName,
      state: ScanState.InProgress,
      lastRunAt: new Date(),
    }))
    await updateFileWithResults(file._id, resultsInprogress)
    scanners.scan(file).then((resultsArray) => updateFileWithResults(file._id, resultsArray))
  }

  return file
}

async function updateFileWithResults(_id: Schema.Types.ObjectId, results: FileScanResult[]) {
  for (const result of results) {
    const updateExistingResult = await FileModel.updateOne(
      { _id, 'avScan.toolName': result.toolName },
      {
        $set: { 'avScan.$': { ...result } },
      },
    )
    if (updateExistingResult.modifiedCount === 0) {
      await FileModel.updateOne(
        { _id, avScan: { $exists: true } },
        {
          $push: { avScan: { toolName: result.toolName, state: result.state, lastRunAt: new Date() } },
        },
      )
    }
  }
}

export async function downloadFile(user: UserInterface, fileId: string, range?: { start: number; end: number }) {
  const file = await getFileById(user, fileId)
  const model = await getModelById(user, file.modelId)

  const auth = await authorisation.file(user, model, file, FileAction.Download)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  return getObjectStream(file.bucket, file.path, range)
}

export async function getFileById(user: UserInterface, fileId: string) {
  const file = await FileModel.findOne({
    _id: fileId,
  })

  if (!file) {
    throw NotFound(`The requested file was not found.`, { fileId })
  }

  const model = await getModelById(user, file.modelId)
  const auth = await authorisation.file(user, model, file, FileAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  return file
}

export async function getFilesByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const files = await FileModel.find({ modelId })

  const auths = await authorisation.files(user, model, files, FileAction.View)
  return files.filter((_, i) => auths[i].success)
}

export async function getFilesByIds(user: UserInterface, modelId: string, fileIds: string[]) {
  const model = await getModelById(user, modelId)
  if (fileIds.length === 0) {
    return []
  }
  const files = await FileModel.find({ _id: { $in: fileIds } })

  if (files.length !== fileIds.length) {
    const notFoundFileIds = fileIds.filter((id) => files.some((file) => file._id.toString() === id))
    throw NotFound(`The requested files were not found.`, { fileIds: notFoundFileIds })
  }

  const auths = await authorisation.files(user, model, files, FileAction.View)
  return files.filter((_, i) => auths[i].success)
}

export async function removeFile(user: UserInterface, modelId: string, fileId: string) {
  const model = await getModelById(user, modelId)
  const file = await getFileById(user, fileId)
  if (model.settings.mirror.sourceModelId) {
    throw BadReq(`Cannot remove file from a mirrored model`)
  }

  const auth = await authorisation.file(user, model, file, FileAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  await removeFileFromReleases(user, model, fileId)

  // We don't actually remove the file from storage, we only hide all
  // references to it.  This makes the file not visible to the user.
  await file.delete()

  return file
}

export async function getTotalFileSize(fileIds: string[]) {
  const totalSize = await FileModel.aggregate()
    .match({ _id: { $in: fileIds } })
    .group({
      _id: null,
      totalSize: { $sum: '$size' },
    })
  return totalSize.at(0).totalSize
}

export async function rerunFileScan(user: UserInterface, modelId, fileId: string) {
  const model = await getModelById(user, modelId)
  if (!model) {
    throw BadReq('Cannot find requested model', { modelId: modelId })
  }
  const file = await getFileById(user, fileId)
  if (!file) {
    throw BadReq('Cannot find requested file', { modelId: modelId, fileId: fileId })
  }
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }
  if (scanners.info()) {
    const resultsInprogress = scanners.info().map((scannerName) => ({
      toolName: scannerName,
      state: ScanState.InProgress,
      lastRunAt: new Date(),
    }))
    await updateFileWithResults(file._id, resultsInprogress)
    scanners.scan(file).then((resultsArray) => updateFileWithResults(file._id, resultsArray))
  }
  return `Scan started for ${file.name}`
}
