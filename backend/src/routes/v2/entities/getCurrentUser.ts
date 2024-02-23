import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { UserInterface } from '../../../models/User.js'
import { registerPath, userInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const getCurrentUserSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/entities/me',
  tags: ['user'],
  description: 'Get the current user',
  schema: getCurrentUserSchema,
  responses: {
    200: {
      description: 'Details about the currently logged in user.',
      content: {
        'application/json': {
          schema: z.object({ user: userInterfaceSchema }),
        },
      },
    },
  },
})

interface GetCurrentUserResponses {
  user: UserInterface
}

export const getCurrentUser = [
  bodyParser.json(),
  async (req: Request, res: Response<GetCurrentUserResponses>) => {
    const _ = parse(req, getCurrentUserSchema)

    return res.json({ user: req.user })
  },
]
