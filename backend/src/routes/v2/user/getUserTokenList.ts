import { Request, Response } from 'express'
import { z } from 'zod'

import { TokenActions } from '../../../models/Token.js'
import { registerPath } from '../../../services/specification.js'

export const getUserTokenListSchema = z.object({})

export const tokenActionMap = Object.values(TokenActions)

registerPath({
  method: 'get',
  path: '/api/v2/user/tokens/list',
  tags: ['token'],
  description: 'Get a list of all user tokens.',
  schema: getUserTokenListSchema,
  responses: {
    200: {
      description: 'An array of user tokens.',
      content: {
        'application/json': {
          schema: z.object({
            tokenActions: z.array(z.object({})),
          }),
        },
      },
    },
  },
})

export const getUserTokenList = [
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      tokenActionMap,
    })
  },
]
