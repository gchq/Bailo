import { putObjectStream } from '../../clients/s3.js'
import authorisation, { ModelAction } from '../../connectors/v2/authorisation/index.js'
import FileModel from '../../models/v2/File.js'
import { UserDoc } from '../../models/v2/User.js'
import config from '../../utils/v2/config.js'
import { Forbidden, NotFound } from '../../utils/v2/error.js'
import { longId } from '../../utils/v2/id.js'
import { getModelById } from './model.js'

export async function uploadFile(user: UserDoc, modelId: string, name: string, mime: string, stream: ReadableStream) {
  const model = await getModelById(user, modelId)

  if (!(await authorisation.userModelAction(user, model, ModelAction.UploadFile))) {
    throw Forbidden(`You do not have permission to upload a file to this model.`, { userDn: user.dn })
  }

  const fileId = longId()

  const bucket = config.s3.buckets.uploads
  const path = `beta/model/${modelId}/files/${fileId}`

  const { fileSize } = await putObjectStream(bucket, path, stream)

  const file = new FileModel({
    modelId,
    name,
    mime,
    bucket,
    path,
    size: fileSize,
    complete: true,
  })

  await file.save()

  return file
}

export async function getFileById(user: UserDoc, fileId: string) {
  const file = await FileModel.findOne({
    _id: fileId,
  })

  if (!file) {
    throw NotFound(`The requested model was not found.`, { fileId })
  }

  const model = await getModelById(user, file.modelId)

  if (!(await authorisation.userModelAction(user, model, ModelAction.View))) {
    throw Forbidden(`You do not have permission to get this file.`, { userDn: user.dn, fileId })
  }

  return file
}

export async function removeFile(user: UserDoc, modelId: string, fileId: string) {
  const model = await getModelById(user, modelId)

  if (!(await authorisation.userModelAction(user, model, ModelAction.DeleteFile))) {
    throw Forbidden(`You do not have permission to delete a file from this model.`, { userDn: user.dn })
  }

  const file = await getFileById(user, fileId)

  // We don't actually remove the file from storage, we only hide all
  // references to it.  This makes the file not visible to the user.
  await file.delete()

  return file
}
