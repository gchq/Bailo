import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { TokenInterface } from '../../../models/Token.js'
import { registerPath, userTokenSchema } from '../../../services/specification.js'
import { findUserTokens } from '../../../services/token.js'
import { parse } from '../../../utils/validate.js'

export const getUserTokensSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/user/tokens',
  tags: ['token'],
  description: 'Get a list of all user tokens.',
  schema: getUserTokensSchema,
  responses: {
    200: {
      description: 'An array of user tokens.',
      content: {
        'application/json': {
          schema: z.object({
            tokens: z.array(userTokenSchema),
          }),
        },
      },
    },
  },
})

interface GetUserTokensResponse {
  tokens: Array<TokenInterface>
}

export const getUserTokens = [
  async (req: Request, res: Response<GetUserTokensResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewUserTokens
    const _ = parse(req, getUserTokensSchema)

    const tokens = await findUserTokens(req.user)
    await audit.onViewUserTokens(req, tokens)

    res.json({
      tokens,
    })
  },
]
