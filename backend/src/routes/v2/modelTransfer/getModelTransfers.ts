import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { ModelTransferInterface } from '../../../models/ModelTransfer.js'
import { findModelTransfersByModelId } from '../../../services/modelTransfer.js'
import { modelTransferSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelTransfersSchema = z.object({
  params: z.object({
    modelId: z.string().openapi({ example: '65df1a0e8c2b7c0012f0abcd' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/transfers',
  tags: ['transfer'],
  description: 'Get the transfers for a given model',
  schema: getModelTransfersSchema,
  responses: {
    200: {
      description: 'The transfers for this model',
      content: {
        'application/json': {
          schema: z.array(modelTransferSchema),
        },
      },
    },
  },
})

interface ModelTransferResponse {
  transfers: ModelTransferInterface[]
}

export const getModelTransfers = [
  async (req: Request, res: Response<ModelTransferResponse>): Promise<void> => {
    const { params } = parse(req, getModelTransfersSchema)

    const transfers = await findModelTransfersByModelId(params.modelId)

    res.json({
      transfers,
    })
  },
]
