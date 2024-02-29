import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { TokenActions, TokenInterface, TokenScope } from '../../../models/v2/Token.js'
import { registerPath, userTokenSchema } from '../../../services/v2/specification.js'
import { createToken } from '../../../services/v2/token.js'
import { parse } from '../../../utils/v2/validate.js'

export const postUserTokenSchema = z.object({
  body: z.object({
    description: z.string().openapi({ example: 'user token' }),

    scope: z.nativeEnum(TokenScope).openapi({ example: 'models' }),
    modelIds: z.array(z.string()).openapi({ example: ['yozlo-v4-abcdef'] }),
    actions: z.array(z.nativeEnum(TokenActions)).openapi({ example: ['image:read', 'file:read'] }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/user/tokens',
  tags: ['token'],
  description: 'Create a new user token.',
  schema: postUserTokenSchema,
  responses: {
    200: {
      description: 'The created user token instance.',
      content: {
        'application/json': {
          schema: z.object({
            token: userTokenSchema,
          }),
        },
      },
    },
  },
})

interface PostUserTokenResponse {
  token: TokenInterface
}

export const postUserToken = [
  bodyParser.json(),
  async (req: Request, res: Response<PostUserTokenResponse>) => {
    req.audit = AuditInfo.CreateUserToken
    const { body } = parse(req, postUserTokenSchema)

    const token = await createToken(req.user, body)
    await audit.onCreateUserToken(req, token)

    return res.json({
      token,
    })
  },
]
