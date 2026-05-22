import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Roles } from '../../../connectors/authentication/constants.js'
import authentication from '../../../connectors/authentication/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'

const getCurrentUserResponseSchema = z.object({ user: z.object({ dn: z.string(), systemRoles: z.array(z.string()) }) })
export type GetCurrentUserResponse = z.infer<typeof getCurrentUserResponseSchema>

registerPath(
  {
    method: 'get',
    path: '/api/v3/entities/me',
    tags: ['user'],
    description: 'Get the current user',
    schema: z.object({}),
    responses: {
      200: {
        description: 'Details about the currently logged in user.',
        content: {
          'application/json': {
            schema: getCurrentUserResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export const getCurrentUser = [
  async (req: Request, res: Response<GetCurrentUserResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewCurrentUserInformation
    const systemRoles = [
      ...((await authentication.hasRole(req.user, Roles.Admin)) ? [Roles.Admin] : []),
      ...((await authentication.hasRole(req.user, Roles.Compliance)) ? [Roles.Compliance] : []),
    ]
    const response = { user: { ...req.user, systemRoles } }
    await audit.onViewCurrentUserInformation(req, response)

    res.json(response)
  },
]
