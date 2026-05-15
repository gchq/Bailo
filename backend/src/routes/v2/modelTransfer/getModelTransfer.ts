import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { ModelTransferInterface } from '../../../models/ModelTransfer.js'
import { findModelTransferById } from '../../../services/modelTransfer.js'
import { modelTransferSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelTransferSchema = z.object({
  params: z.object({
    exportId: z.string().openapi({ example: 'abc123' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/transfer/{exportId}',
  tags: ['transfer'],
  description: 'Get the details for a given model transfer',
  schema: getModelTransferSchema,
  responses: {
    200: {
      description: 'Details about the transfer of this model',
      content: {
        'application/json': {
          schema: modelTransferSchema,
        },
      },
    },
  },
})

interface ModelTransferResponse {
  transfer: ModelTransferInterface
}

export const getModelTransfer = [
  async (req: Request, res: Response<ModelTransferResponse>): Promise<void> => {
    const {
      params: { exportId },
    } = parse(req, getModelTransferSchema)

    const modelTransfer = await findModelTransferById(req.user, exportId)

    res.json({
      transfer: modelTransfer,
    })
  },
]
