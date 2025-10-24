import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { startUploadMultipartFile } from '../../../../services/file.js'
import { registerPath } from '../../../../services/specification.js'
import { coerceArray, parse } from '../../../../utils/validate.js'

export const postStartMultipartUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
    size: z.number().positive(),
    tags: coerceArray(z.array(z.string()).optional()),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/files/upload/multipart/start',
  tags: ['file'],
  description: 'Start uploading a new multipart file to a model.',
  schema: postStartMultipartUploadSchema,
  responses: {
    200: {
      description: "The newly created file's chunk details.",
      content: {
        'application/json': {
          schema: z.object({
            fileId: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
            uploadId: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
            chunks: z.array(z.object({ startByte: z.number(), endByte: z.number() })),
          }),
        },
      },
    },
  },
})

export interface ChunkByteRange {
  startByte: number
  endByte: number
}

interface PostStartMultipartUpload {
  fileId: string
  uploadId: string
  chunks: Array<ChunkByteRange>
}

export const postStartMultipartUpload = [
  bodyParser.json(),
  async (req: Request, res: Response<PostStartMultipartUpload>): Promise<void> => {
    req.audit = AuditInfo.CreateFile
    // Does user have permission to upload a file?
    const {
      params: { modelId },
      body: { name, mime, size, tags },
    } = parse(req, postStartMultipartUploadSchema)

    const { file, uploadId, chunks } = await startUploadMultipartFile(req.user, modelId, name, mime, size, tags)
    await audit.onCreateFile(req, file)

    res.json({
      fileId: file.id,
      uploadId,
      chunks,
    })
  },
]
