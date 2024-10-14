import { Readable } from 'stream'

import { getObjectStream, putObjectStream } from '../clients/s3.js'
import { FileAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileScanResult } from '../connectors/fileScanning/Base.js'
import runFileScanners from '../connectors/fileScanning/index.js'
import FileModel, { FileInterface } from '../models/File.js'
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
  file.size = fileSize

  await file.save()

  if (runFileScanners().info()) {
    runFileScanners()
      .scan(file)
      .then((resultsArray) => updateFileWithResults(file, resultsArray))
  }

  return file
}

export async function updateFileWithResults(file: FileInterface, results: FileScanResult[]) {
  for (const result of results) {
    if (!file.avScan.find((avScanResult) => avScanResult.toolName === result.toolName)) {
      const updatedAvScanArray = [...file.avScan, { toolName: result.toolName, state: result.state }]
      file.avScan = updatedAvScanArray
      await FileModel.updateOne(
        { _id: file._id },
        {
          $set: { avScan: updatedAvScanArray },
        },
      )
    } else {
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': result.toolName },
        {
          $set: { 'avScan.$': result },
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
