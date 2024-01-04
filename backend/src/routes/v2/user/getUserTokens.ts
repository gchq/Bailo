import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { TokenInterface } from '../../../models/v2/Token.js'
import { registerPath, userTokenSchema } from '../../../services/v2/specification.js'
import { findUserTokens } from '../../../services/v2/token.js'
import { parse } from '../../../utils/v2/validate.js'

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
  bodyParser.json(),
  async (req: Request, res: Response<GetUserTokensResponse>) => {
    req.audit = AuditInfo.ViewUserTokens
    const _ = parse(req, getUserTokensSchema)

    const tokens = await findUserTokens(req.user)
    await audit.onViewUserTokens(req, tokens)

    return res.json({
      tokens,
    })
  },
]
