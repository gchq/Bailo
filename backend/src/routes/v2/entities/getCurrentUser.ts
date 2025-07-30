import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Roles } from '../../../connectors/authentication/Base.js'
import authentication from '../../../connectors/authentication/index.js'
import { UserInterface } from '../../../models/User.js'
import { registerPath, userInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

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
  async (req: Request, res: Response<GetCurrentUserResponses>): Promise<void> => {
    const _ = parse(req, getCurrentUserSchema)
    const isAdmin = await authentication.hasRole(req.user, Roles.Admin)
    res.json({ user: { ...req.user, isAdmin } })
  },
]
