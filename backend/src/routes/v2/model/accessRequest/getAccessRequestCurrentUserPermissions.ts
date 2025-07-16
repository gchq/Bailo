import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { getCurrentUserPermissionsByAccessRequest } from '../../../../services/accessRequest.js'
import { accessRequestUserPermissionsSchema, registerPath } from '../../../../services/specification.js'
import { AccessRequestUserPermissions } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getAccessRequestCurrentUserPermissionsSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/permissions/mine',
  tags: ['permissions'],
  description: 'Get all current user permissions for an access request.',
  schema: getAccessRequestCurrentUserPermissionsSchema,
  responses: {
    200: {
      description: `Details about the currently logged in user's permissions for an access request.`,
      content: {
        'application/json': {
          schema: z.object({
            permissions: accessRequestUserPermissionsSchema,
          }),
        },
      },
    },
  },
})

interface GetAccessRequestCurrentUserPermissionsResponse {
  permissions: AccessRequestUserPermissions
}

export const getAccessRequestCurrentUserPermissions = [
  bodyParser.json(),
  async (req: Request, res: Response<GetAccessRequestCurrentUserPermissionsResponse>): Promise<void> => {
    const {
      params: { accessRequestId },
    } = parse(req, getAccessRequestCurrentUserPermissionsSchema)

    const permissions = await getCurrentUserPermissionsByAccessRequest(req.user, accessRequestId)

    res.json({
      permissions,
    })
  },
]
