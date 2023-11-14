import { getObjectStream, putObjectStream } from '../../clients/s3.js'
import { FileAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import FileModel from '../../models/v2/File.js'
import { UserDoc } from '../../models/v2/User.js'
import { asyncFilter } from '../../utils/general.js'
import config from '../../utils/v2/config.js'
import { Forbidden, NotFound } from '../../utils/v2/error.js'
import { longId } from '../../utils/v2/id.js'
import { getModelById } from './model.js'

export async function uploadFile(user: UserDoc, modelId: string, name: string, mime: string, stream: ReadableStream) {
  const model = await getModelById(user, modelId)

  const fileId = longId()

  const bucket = config.s3.buckets.uploads
  const path = `beta/model/${modelId}/files/${fileId}`

  const file = new FileModel({
    modelId,
    name,
    mime,
    bucket,
    path,
    complete: true,
  })

  if (!(await authorisation.userFileAction(user, model, file, FileAction.Upload))) {
    throw Forbidden(`You do not have permission to upload a file to this model.`, { userDn: user.dn })
  }

  const { fileSize } = await putObjectStream(bucket, path, stream)
  file.size = fileSize

  await file.save()

  return file
}

export async function downloadFile(user: UserDoc, fileId: string, range?: { start: number; end: number }) {
  const file = await getFileById(user, fileId)
  const model = await getModelById(user, file.modelId)

  const access = await authorisation.userFileAction(user, model, file, FileAction.Download)
  if (!access) {
    throw Forbidden(`You do not have permission to download this model.`, { user: user.dn, fileId })
  }

  return getObjectStream(file.bucket, file.path, range)
}

export async function getFileById(user: UserDoc, fileId: string) {
  const file = await FileModel.findOne({
    _id: fileId,
  })

  if (!file) {
    throw NotFound(`The requested model was not found.`, { fileId })
  }

  const model = await getModelById(user, file.modelId)

  if (!(await authorisation.userFileAction(user, model, file, FileAction.View))) {
    throw Forbidden(`You do not have permission to get this file.`, { userDn: user.dn, fileId })
  }

  return file
}

export async function getFilesByModel(user: UserDoc, modelId: string) {
  const model = await getModelById(user, modelId)
  const files = await FileModel.find({ modelId })

  return asyncFilter(files, (file) => authorisation.userFileAction(user, model, file, FileAction.View))
}

export async function removeFile(user: UserDoc, modelId: string, fileId: string) {
  const model = await getModelById(user, modelId)
  const file = await getFileById(user, fileId)

  if (!(await authorisation.userFileAction(user, model, file, FileAction.Delete))) {
    throw Forbidden(`You do not have permission to delete a file from this model.`, { userDn: user.dn })
  }

  // We don't actually remove the file from storage, we only hide all
  // references to it.  This makes the file not visible to the user.
  await file.delete()

  return file
}
