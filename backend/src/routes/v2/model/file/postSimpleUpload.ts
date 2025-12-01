import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { FileWithScanResultsInterface } from '../../../../models/File.js'
import { uploadFile } from '../../../../services/file.js'
import { fileWithScanInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { coerceArray, parse } from '../../../../utils/validate.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
    tags: coerceArray(z.array(z.string()).optional()),
    metadataText: z.string().optional(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/files/upload/simple',
  tags: ['file'],
  description: 'Upload a new file to a model.',
  schema: postSimpleUploadSchema,
  responses: {
    200: {
      description: 'The newly created file instance.',
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

interface PostSimpleUpload {
  file: FileWithScanResultsInterface
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>): Promise<void> => {
    req.audit = AuditInfo.CreateFile
    const {
      params: { modelId },
      query: { name, mime, tags },
    } = parse(req, postSimpleUploadSchema)

    const file = await uploadFile(req.user, modelId, name, mime, req, tags)
    await audit.onCreateFile(req, file)

    res.json({
      file,
    })
  },
]
