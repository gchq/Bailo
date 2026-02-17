import { Request, Response } from 'express'

import { z } from '../../../../lib/zod.js'
import { createAllowedBailoInstance } from '../../../../services/bailoInstance.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const createAllowedInstanceSchema = z.object({
  body: z.object({
    instanceId: z.string().min(1),
    userIds: z.array(z.string().min(1)).min(1),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/system/allowed-instances',
  tags: ['system'],
  description: 'Create an allowed Bailo instance',
  schema: createAllowedInstanceSchema,
  responses: {
    201: {
      description: 'Allowed Bailo instance created',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
          }),
        },
      },
    },
  },
})

interface CreateAllowedBailoInstanceResponse {
  id: string
}

export const createAllowedBailoInstanceRoute = [
  async (req: Request, res: Response<CreateAllowedBailoInstanceResponse>): Promise<void> => {
    const { body } = parse(req, createAllowedInstanceSchema)

    const id = await createAllowedBailoInstance(body.instanceId, body.userIds)

    res.status(201).json({ id })
  },
]
