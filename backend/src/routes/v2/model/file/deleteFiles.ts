import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { removeFiles } from '../../../../services/file.js'
import { registerPath } from '../../../../services/specification.js'
import { useTransaction } from '../../../../utils/transactions.js'
import { parse } from '../../../../utils/validate.js'

export const deleteFilesSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    fileIds: z.array(z.string()).min(1, 'Must provide at least one file ID'),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/files',
  tags: ['file'],
  description:
    'Delete multiple files from a model. All deletions are performed within a transaction so that a failure rolls back the entire batch.',
  schema: deleteFilesSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the files.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed 3 file(s).' }),
          }),
        },
      },
    },
  },
})

interface DeleteFilesResponse {
  message: string
}

export const deleteFiles = [
  async (req: Request, res: Response<DeleteFilesResponse>): Promise<void> => {
    req.audit = AuditInfo.DeleteFile
    const {
      params: { modelId },
      body: { fileIds },
    } = parse(req, deleteFilesSchema)

    const [files] = await useTransaction([(session) => removeFiles(req.user, modelId, fileIds, false, false, session)])

    for (const file of files) {
      await audit.onDeleteFile(req, file)
    }

    res.json({
      message: `Successfully removed ${files.length} file(s).`,
    })
  },
]
