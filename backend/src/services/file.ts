import { Readable } from 'node:stream'

import { ClientSession, Types } from 'mongoose'
import prettyBytes from 'pretty-bytes'

import {
  completeMultipartUpload,
  getObjectStream,
  headObject,
  putObjectPartStream,
  putObjectStream,
  startMultipartUpload,
} from '../clients/s3.js'
import { FileAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import FileModel, { FileInterface, FileInterfaceDoc, FileWithScanResultsInterface } from '../models/File.js'
import { ModelDoc } from '../models/Model.js'
import ScanModel from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { ChunkByteRange } from '../routes/v2/model/file/postStartMultipartUpload.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { createFilePath } from '../utils/fileUtils.js'
import { longId } from '../utils/id.js'
import log from './log.js'
import { getModelById } from './model.js'
import { removeFileFromReleases } from './release.js'
import { scanFile } from './scan.js'

export async function uploadFile(
  user: UserInterface,
  modelId: string,
  name: string,
  mime: string,
  stream: Readable,
  tags?: string[],
) {
  const model = await getModelById(user, modelId)
  if (model.settings.mirror.sourceModelId) {
    throw BadReq('Cannot upload files to a mirrored model.')
  }

  const fileId = longId()

  const path = createFilePath(modelId, fileId)

  const file: FileInterfaceDoc = new FileModel({ modelId, name, mime, path, complete: true })

  const auth = await authorisation.file(user, model, file, FileAction.Upload)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId: file._id.toString() })
  }

  const { fileSize } = await putObjectStream(path, stream)
  if (fileSize === 0) {
    throw BadReq(`Could not upload ${file.name} as it is an empty file.`, { file: file })
  }
  file.size = fileSize

  if (tags) {
    file.tags = tags
  }

  await file.save()

  return await scanFile(file)
}

export async function saveImportedFile(file: FileInterface) {
  await FileModel.findOneAndUpdate({ modelId: file.modelId, _id: file._id }, file, {
    upsert: true,
  })
}

export async function startUploadMultipartFile(
  user: UserInterface,
  modelId: string,
  name: string,
  mime: string,
  size: number,
  tags?: string[],
) {
  const model = await getModelById(user, modelId)
  if (model.settings?.mirror?.sourceModelId) {
    throw BadReq('Cannot upload files to a mirrored model.')
  }

  const fileId = longId()
  const path = createFilePath(modelId, fileId)

  const file: FileInterfaceDoc = new FileModel({ modelId, name, mime, path, complete: false })

  const auth = await authorisation.file(user, model, file, FileAction.Upload)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId: file._id.toString() })
  }

  const { uploadId } = await startMultipartUpload(path, mime)
  if (!uploadId) {
    throw InternalError('Failed to get uploadId from startMultipartUpload.')
  }

  const numChunks = Math.ceil(size / config.s3.multipartChunkSize)

  const chunks: ChunkByteRange[] = []
  for (let partNumber = 1; partNumber <= numChunks; partNumber++) {
    const startByte = (partNumber - 1) * config.s3.multipartChunkSize
    const endByte = Math.min(startByte + config.s3.multipartChunkSize, size) - 1
    chunks.push({ startByte, endByte })
  }

  if (tags) {
    file.tags = tags
  }

  await file.save()

  return { file, uploadId, chunks }
}

export async function uploadMultipartFilePart(
  user: UserInterface,
  modelId: string,
  fileId: string,
  uploadId: string,
  partNumber: number,
  stream: Readable,
  bodySize: number,
) {
  const file = await getFileById(user, fileId)
  const model = await getModelById(user, modelId)

  const auth = await authorisation.file(user, model, file, FileAction.Upload)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  return await putObjectPartStream(file.path, uploadId, partNumber, stream, bodySize)
}

export async function finishUploadMultipartFile(
  user: UserInterface,
  modelId: string,
  fileId: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>,
  tags?: string[],
) {
  const file = await FileModel.findById(fileId)
  if (!file) {
    throw NotFound('The requested file was not found.', { fileId })
  }

  const model = await getModelById(user, modelId)

  const auth = await authorisation.file(user, model, file, FileAction.Upload)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  await completeMultipartUpload(file.path, uploadId, parts)

  const metadata = await headObject(file.path)
  if (!metadata.ContentLength) {
    throw BadReq('Could not determine uploaded file size.', { fileId })
  }
  file.size = metadata.ContentLength
  file.complete = true

  if (tags) {
    file.tags = tags
  }

  file.save()

  return await scanFile(file)
}

export async function downloadFile(user: UserInterface, fileId: string, range?: { start: number; end: number }) {
  const file = await getFileById(user, fileId)
  const model = await getModelById(user, file.modelId)

  const auth = await authorisation.file(user, model, file, FileAction.Download)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  const stream = await getObjectStream(file.path, undefined, range)

  const totalBytes = file.size
  const totalPretty = prettyBytes(totalBytes)
  let progress = 0
  let lastLoggedAt = 0
  stream.on('data', function (chunk) {
    // Advance your progress by chunk.length
    progress += chunk.length

    const now = Date.now()
    // Only log every 0.5 seconds to avoid spamming logs excessively
    if (now - lastLoggedAt < 500) {
      return
    }

    lastLoggedAt = now
    log.debug(
      {
        loaded: prettyBytes(progress),
        loadedBytes: progress,
        total: totalPretty,
        totalBytes,
        fileId,
      },
      'Object download is in progress',
    )
  })

  stream.on('close', () => {
    log.debug(
      {
        loaded: prettyBytes(progress),
        loadedBytes: progress,
        total: prettyBytes(file.size),
        totalBytes: file.size,
        fileId,
      },
      progress === file.size
        ? 'Object download stream closed with no data remaining'
        : 'Object download stream closed with data remaining',
    )
  })

  return stream
}

export async function getFileById(
  user: UserInterface,
  fileId: string,
  model?: ModelDoc,
): Promise<FileWithScanResultsInterface> {
  const files: FileWithScanResultsInterface[] = await FileModel.aggregate([
    { $match: { _id: new Types.ObjectId(fileId) } },
    { $limit: 1 },
    { $addFields: { id: { $toString: '$_id' } } },
    {
      $lookup: {
        from: 'v2_scans',
        localField: 'id',
        foreignField: 'fileId',
        as: 'scanResults',
      },
    },
  ])

  if (!files || files.length === 0) {
    throw NotFound(`The requested file was not found.`, { fileId })
  }
  const file: FileWithScanResultsInterface = { ...files[0], id: files[0]._id.toString() }

  if (!model) {
    model = await getModelById(user, file.modelId)
  }
  const auth = await authorisation.file(user, model, file, FileAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, fileId })
  }

  return file
}

export async function getFilesByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const files: FileWithScanResultsInterface[] = await FileModel.aggregate([
    { $match: { modelId } },
    { $addFields: { id: { $toString: '$_id' } } },
    {
      $lookup: {
        from: 'v2_scans',
        localField: 'id',
        foreignField: 'fileId',
        as: 'scanResults',
      },
    },
  ])

  const auths = await authorisation.files(user, model, files, FileAction.View)
  return files.filter((_, i) => auths[i].success)
}

export async function getFilesByIds(
  user: UserInterface,
  modelId: string,
  fileIds: string[],
): Promise<FileWithScanResultsInterface[]> {
  const model = await getModelById(user, modelId)
  if (fileIds.length === 0) {
    return []
  }
  const files: FileWithScanResultsInterface[] = await FileModel.aggregate([
    { $match: { _id: { $in: fileIds } } },
    { $addFields: { id: { $toString: '$_id' } } },
    {
      $lookup: {
        from: 'v2_scans',
        localField: 'id',
        foreignField: 'fileId',
        as: 'scanResults',
      },
    },
  ])

  if (files.length !== fileIds.length) {
    const notFoundFileIds = fileIds.filter((id) => files.some((file) => file._id.toString() === id))
    throw NotFound(`The requested files were not found.`, { fileIds: notFoundFileIds })
  }

  const auths = await authorisation.files(user, model, files, FileAction.View)
  return files.filter((_, i) => auths[i].success)
}

export async function removeFiles(
  user: UserInterface,
  modelId: string,
  fileIds: string[],
  deleteMirroredModel: boolean = false,
  session?: ClientSession | undefined,
) {
  const model = await getModelById(user, modelId)
  if (model.settings.mirror.sourceModelId && !deleteMirroredModel) {
    throw BadReq('Cannot remove file from a mirrored model.')
  }
  const allFiles: FileWithScanResultsInterface[] = []

  for (const fileId of fileIds) {
    const file = await getFileById(user, fileId)
    allFiles.push(file)
    const auth = await authorisation.file(user, model, file, FileAction.Delete)
    if (!auth.success) {
      throw Forbidden(auth.info, { userDn: user.dn })
    }

    await removeFileFromReleases(user, model, fileId)

    await ScanModel.deleteMany({ fileId: { $eq: file.id } }, session)

    // We don't actually remove the file from storage, we only hide all
    // references to it.  This makes the file not visible to the user.
    await FileModel.findOneAndDelete({ _id: file._id }, session)
  }

  return allFiles
}

export async function removeFile(
  user: UserInterface,
  modelId: string,
  fileId: string,
  deleteMirroredModel: boolean = false,
  session?: ClientSession | undefined,
) {
  return (await removeFiles(user, modelId, [fileId], deleteMirroredModel, session))[0]
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

export async function markFileAsCompleteAfterImport(path: string) {
  const file = await FileModel.findOneAndUpdate(
    {
      path,
    },
    { complete: true },
  )

  if (!file) {
    log.debug({ path }, 'No file document yet exists for this imported file.')
  }
}

export async function updateFile(
  user: UserInterface,
  modelId: string,
  fileId: string,
  patchFileParams: Partial<Pick<FileInterface, 'tags' | 'name' | 'mime'>>,
) {
  let file: FileWithScanResultsInterface
  try {
    file = await getFileById(user, fileId)
  } catch {
    throw BadReq('Cannot find requested file', { modelId: modelId, fileId: fileId })
  }

  let model: ModelDoc
  try {
    model = await getModelById(user, modelId)
  } catch {
    throw BadReq('Cannot find requested model', { modelId: modelId })
  }

  const patchFileAuth = await authorisation.file(user, model, file, FileAction.Update)
  if (!patchFileAuth.success) {
    throw Forbidden(patchFileAuth.info, { userDn: user.dn, modelId, file })
  }

  const updatedFile = await FileModel.findOneAndUpdate({ _id: fileId }, patchFileParams, { new: true })
  if (!updatedFile) {
    throw BadReq('There was a problem updating the file', { modelId, fileId, patchFileParams })
  }

  // return the full FileWithScanResultsInterface and not just the FileInterface
  file = await getFileById(user, fileId)

  return file
}
