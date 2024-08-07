import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { tokenActionIds, TokenInterface, TokenScope } from '../../../models/Token.js'
import { registerPath, userTokenSchema } from '../../../services/specification.js'
import { createToken } from '../../../services/token.js'
import { parse } from '../../../utils/validate.js'

export const postUserTokenSchema = z.object({
  body: z.object({
    description: z.string().openapi({ example: 'user token' }),

    scope: z.nativeEnum(TokenScope).openapi({ example: 'models' }),
    modelIds: z.array(z.string()).openapi({ example: ['yolo-v4-abcdef'] }),
    actions: z.array(z.enum(['image:read', ...tokenActionIds])).openapi({ example: ['image:read', 'file:read'] }),
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
