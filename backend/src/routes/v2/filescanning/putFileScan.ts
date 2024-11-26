import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { getCurrentUserPermissionsByModel } from '../../../services/model.js'
import { entryUserPermissionsSchema, registerPath } from '../../../services/specification.js'
import { EntryUserPermissions } from '../../../types/types.js'
import { parse } from '../../../utils/validate.js'

export const putFileScanSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/filescanning/model/{modelId}/file/{fileId}/scan',
  tags: ['filescanning'],
  description: 'Manually re-request a new antivirus scan for a file',
  schema: putFileScanSchema,
  responses: {
    200: {
      description: ``,
      content: {
        'application/json': {
          status: z.string().openapi({ example: 'user:user' }),
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
  async (req: Request, res: Response<GetModelCurrentUserPermissionsResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getModelCurrentUserPermissionsSchema)

    const permissions = await getCurrentUserPermissionsByModel(req.user, modelId)

    return res.json({
      permissions,
    })
  },
]
