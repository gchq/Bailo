import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { registerPath } from '../../../services/v2/specification.js'
import { removeToken } from '../../../services/v2/token.js'
import { parse } from '../../../utils/v2/validate.js'

export const deleteUserTokenSchema = z.object({
  params: z.object({
    accessKey: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/user/token/{accessKey}',
  tags: ['token'],
  description: 'Delete a release.',
  schema: deleteUserTokenSchema,
  responses: {
    200: {
      description: 'A success message.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Succesfully removed access key' }),
          }),
        },
      },
    },
  },
})

interface DeleteUserTokenResponse {
  message: string
}

export const deleteUserToken = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteUserTokenResponse>) => {
    req.audit = AuditInfo.DeleteUserToken
    const {
      params: { accessKey },
    } = parse(req, deleteUserTokenSchema)

    await removeToken(req.user, accessKey)
    await audit.onDeleteUserToken(req, accessKey)

    return res.json({
      message: 'Successfully removed access key.',
    })
  },
]
