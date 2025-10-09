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
            fileId: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
            uploadId: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
            chunks: z.array(z.object({ presignedUrl: z.string(), startByte: z.number(), endByte: z.number() })),
          }),
        },
      },
    },
  },
})

export const postMultipartUploadPart = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.CreateFile
    // Does user have permission to upload a file?
    const {
      params: { modelId, fileId, uploadId, partNumber },
    } = parse(req, postMultipartUploadPartSchema)

    const filePart = await uploadMultipartFilePart(req.user, modelId, fileId, uploadId, partNumber, req)
    await audit.onUpdateFile(req, modelId, fileId)

    res.json({ ETag: filePart.ETag })
  },
]
