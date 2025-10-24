import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { uploadMultipartFilePart } from '../../../../services/file.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postMultipartUploadPartSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    fileId: z.string(),
    uploadId: z.string(),
    partNumber: z.number().positive(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/files/upload/multipart/part',
  tags: ['file'],
  description: 'Upload a new multipart part of a file to a model.',
  schema: postMultipartUploadPartSchema,
  responses: {
    200: {
      description: "The newly created file's chunk details.",
      content: {
        'application/json': {
          schema: z.object({
            ETag: z.string().openapi({ example: 'd8c2eafd90c266e19ab9dcacc479f8af' }),
          }),
        },
      },
    },
  },
})

interface PostMultipartUploadPart {
  ETag: string
}

export const postMultipartUploadPart = [
  bodyParser.json(),
  async (req: Request, res: Response<PostMultipartUploadPart>): Promise<void> => {
    req.audit = AuditInfo.CreateFile
    // Does user have permission to upload a file?
    const {
      params: { modelId },
      body: { fileId, uploadId, partNumber },
    } = parse(req, postMultipartUploadPartSchema)

    const filePartETag = await uploadMultipartFilePart(req.user, modelId, fileId, uploadId, partNumber, req)
    await audit.onUpdateFile(req, modelId, fileId)

    res.json({ ETag: filePartETag })
  },
]
