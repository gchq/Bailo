import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { getCurrentUserPermissionsByModel } from '../../../services/model.js'
import { entryUserPermissionsSchema, registerPath } from '../../../services/specification.js'
import { EntryUserPermissions } from '../../../types/types.js'
import { parse } from '../../../utils/validate.js'

export const getModelCurrentUserPermissionsSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/permissions/mine',
  tags: ['permissions'],
  description: 'Get all current user permissions for a model.',
  schema: getModelCurrentUserPermissionsSchema,
  responses: {
    200: {
      description: `Details about the currently logged in user's permissions for a model.`,
      content: {
        'application/json': {
          schema: z.object({
            permissions: entryUserPermissionsSchema,
          }),
        },
      },
    },
  },
})

interface GetModelCurrentUserPermissionsResponse {
  permissions: EntryUserPermissions
}

export const getModelCurrentUserPermissions = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCurrentUserPermissionsResponse>): Promise<void> => {
    const {
      params: { modelId },
    } = parse(req, getModelCurrentUserPermissionsSchema)

    const permissions = await getCurrentUserPermissionsByModel(req.user, modelId)

    res.json({
      permissions,
    })
  },
]
