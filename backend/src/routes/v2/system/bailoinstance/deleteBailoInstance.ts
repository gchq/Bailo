import { Request, Response } from 'express'

import { z } from '../../../../lib/zod.js'
import { deleteAllowedBailoInstance } from '../../../../services/bailoInstance.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const deleteAllowedInstanceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/system/allowed-instances/{id}',
  tags: ['system'],
  description: 'Delete an allowed Bailo instance',
  schema: deleteAllowedInstanceSchema,
  responses: {
    204: {
      description: 'Allowed Bailo instance deleted',
    },
    404: {
      description: 'Allowed Bailo instance not found',
    },
  },
})

export const deleteAllowedBailoInstanceRoute = [
  async (req: Request, res: Response): Promise<void> => {
    const { params } = parse(req, deleteAllowedInstanceSchema)

    await deleteAllowedBailoInstance(params.id)

    res.status(204).send()
  },
]
