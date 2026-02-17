import { Request, Response } from 'express'

import { z } from '../../../../lib/zod.js'
import { BailoInstanceInterface } from '../../../../models/BailoInstance.js'
import { findAllowedBailoInstances } from '../../../../services/bailoInstance.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getAllowedInstancesSchema = z.object({})

export const allowedBailoInstanceSchema = z.object({
  _id: z.string(),
  instanceId: z.string(),
  userIds: z.array(z.string()),
})

export const getAllowedInstancesResponseSchema = z.object({
  instances: z.array(allowedBailoInstanceSchema),
})

registerPath({
  method: 'get',
  path: '/api/v2/system/allowed-instances',
  tags: ['system'],
  description: 'Get the allowed Bailo instances',
  schema: getAllowedInstancesSchema,
  responses: {
    200: {
      description: 'The Bailo instances in the allow-list.',
      content: {
        'application/json': {
          schema: getAllowedInstancesResponseSchema,
        },
      },
    },
  },
})

interface GetAllowedBailoInstancesResponse {
  instances: Array<BailoInstanceInterface>
}

export const getAllowedBailoInstances = [
  async (req: Request, res: Response<GetAllowedBailoInstancesResponse>): Promise<void> => {
    const _ = parse(req, getAllowedInstancesSchema)

    res.json({
      instances: await findAllowedBailoInstances(),
    })
  },
]
