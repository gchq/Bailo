import { Request, Response } from 'express'

import { z } from '../../../../lib/zod.js'
import { updateAllowedBailoInstance } from '../../../../services/bailoInstance.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const updateAllowedInstanceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z
    .object({
      instanceId: z.string().min(1).optional(),
      userIds: z.array(z.string().min(1)).min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' }),
})

registerPath({
  method: 'put',
  path: '/api/v2/system/allowed-instances/{id}',
  tags: ['system'],
  description: 'Update an allowed Bailo instance',
  schema: updateAllowedInstanceSchema,
  responses: {
    200: {
      description: 'Allowed Bailo instance updated',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
          }),
        },
      },
    },
    404: {
      description: 'Allowed Bailo instance not found',
    },
  },
})

interface UpdateAllowedBailoInstanceResponse {
  id: string
}

export const updateAllowedBailoInstanceRoute = [
  async (req: Request, res: Response<UpdateAllowedBailoInstanceResponse>): Promise<void> => {
    const { params, body } = parse(req, updateAllowedInstanceSchema)

    const updated = await updateAllowedBailoInstance(params.id, body)

    res.status(200).json({ id: updated._id.toString() })
  },
]
