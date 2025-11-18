import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { FileWithScanResultsInterface } from '../../../../models/File.js'
import { finishUploadMultipartFile } from '../../../../services/file.js'
import { fileWithScanInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { coerceArray, parse } from '../../../../utils/validate.js'

export const postFinishMultipartUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    fileId: z.string(),
    uploadId: z.string(),
    parts: coerceArray(
      z
        .array(
          z.object({
            ETag: z.string(),
            PartNumber: z.number(),
          }),
        )
        .min(1),
    ),
    tags: coerceArray(z.array(z.string()).optional()),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/files/upload/multipart/finish',
  tags: ['file'],
  description: 'Finish uploading a multipart file.',
  schema: postFinishMultipartUploadSchema,
  responses: {
    200: {
      description: 'The newly finished file instance.',
      content: {
        'application/json': {
          schema: z.object({
            file: fileWithScanInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostFinishMultipartUpload {
  file: FileWithScanResultsInterface
}

export const postFinishMultipartUpload = [
  bodyParser.json(),
  async (req: Request, res: Response<PostFinishMultipartUpload>): Promise<void> => {
    req.audit = AuditInfo.UpdateFile
    const {
      params: { modelId },
      body: { fileId, uploadId, parts, tags },
    } = parse(req, postFinishMultipartUploadSchema)

    const file = await finishUploadMultipartFile(req.user, modelId, fileId, uploadId, parts, tags)
    await audit.onUpdateFile(req, modelId, fileId)

    res.json({
      file,
    })
  },
]
