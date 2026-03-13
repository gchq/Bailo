import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { removeModel } from '../../../services/model.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const deleteModelSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}',
  tags: ['model'],
  description: 'Delete a model.',
  schema: deleteModelSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the model.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed model' }),
          }),
        },
      },
    },
  },
})

interface DeleteModelResponse {
  message: string
}

export const deleteModel = [
  async (req: Request, res: Response<DeleteModelResponse>): Promise<void> => {
    req.audit = AuditInfo.DeleteModel
    const {
      params: { modelId },
    } = parse(req, deleteModelSchema)

    await removeModel(req.user, modelId)

    await audit.onDeleteModel(req, modelId)

    res.json({
      message: 'Successfully removed model.',
    })
  },
]
