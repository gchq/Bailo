import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { ModelTransferInterface } from '../../../models/ModelTransfer.js'
import { createModelTransfer, findModelTransferById } from '../../../services/modelTransfer.js'
import { modelTransferSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelTransferSchema = z.object({
  params: z.object({
    transferId: z.string().openapi({ example: '65df1a0e8c2b7c0012f0abcd' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/transfer/{transferId}',
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
    const { params } = parse(req, getModelTransferSchema)

    if (params.transferId == '001') {
      await createModelTransfer({
        modelId: 'abcdef2134432234',
        status: 'in_progress',
        createdBy: 'bob',
      })
    } else if (params.transferId == '002') {
      await createModelTransfer({
        modelId: 'cvbsdf333fefvdfgdfg',
        status: 'completed',
        createdBy: 'bob',
      })
    }

    const modelTransfer = await findModelTransferById(params.transferId)

    res.json({
      transfer: modelTransfer,
    })
  },
]
