import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { removeFile } from '../../../../services/file.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const deleteFileSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/file/{fileId}',
  tags: ['file'],
  description: 'Delete a file from a model.',
  schema: deleteFileSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the file.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed file' }),
          }),
        },
      },
    },
  },
})

interface DeleteFileResponse {
  message: string
}

export const deleteFile = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteFileResponse>): Promise<void> => {
    req.audit = AuditInfo.DeleteFile
    const {
      params: { modelId, fileId },
    } = parse(req, deleteFileSchema)

    await removeFile(req.user, modelId, fileId)

    await audit.onDeleteFile(req, modelId, fileId)

    res.json({
      message: 'Successfully removed file.',
    })
  },
]
