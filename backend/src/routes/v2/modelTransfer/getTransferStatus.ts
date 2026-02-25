import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { findModelTransferById } from '../../../services/modelTransfer.js'
import { modelTransferSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelTransferSchema = z.object({
  params: z.object({
    transferId: z.string().openapi({ example: '65df1a0e8c2b7c0012f0abcd' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/transfer/{transferId}/status',
  tags: ['transfer'],
  description: 'Get the status for a given model transfer',
  schema: getModelTransferSchema,
  responses: {
    200: {
      description: 'Status of the transfer of this model',
      content: {
        'application/json': {
          schema: modelTransferSchema,
        },
      },
    },
  },
})

interface ModelTransferStatusResponse {
  status: string
}

export const getModelTransferStatus = [
  async (req: Request, res: Response<ModelTransferStatusResponse>): Promise<void> => {
    const { params } = parse(req, getModelTransferSchema)

    const modelTransfer = await findModelTransferById(params.transferId)

    res.json({
      status: modelTransfer.status,
    })
  },
]
