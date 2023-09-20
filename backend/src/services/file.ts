import { putObjectStream } from '../clients/s3.js'
import authorisation, { ModelAction } from '../connectors/v2/authorisation/index.js'
import FileModel from '../models/v2/File.js'
import { UserDoc } from '../models/v2/User.js'
import config from '../utils/v2/config.js'
import { Forbidden } from '../utils/v2/error.js'
import { longId } from '../utils/v2/id.js'
import { getModelById } from './v2/model.js'

export async function uploadModelFile(
  user: UserDoc,
  modelId: string,
  name: string,
  mime: string,
  stream: ReadableStream
) {
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
