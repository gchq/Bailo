import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { deleteRelease as deleteReleaseService } from '../../../services/release.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const deleteReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/release/{semver}',
  tags: ['release'],
  description: 'Delete a release.',
  schema: deleteReleaseSchema,
  responses: {
    200: {
      description: 'A success message.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed release' }),
          }),
        },
      },
    },
  },
})

interface DeleteReleaseResponse {
  message: string
}

export const deleteRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteReleaseResponse>) => {
    req.audit = AuditInfo.DeleteRelease
    const {
      params: { modelId, semver },
    } = parse(req, deleteReleaseSchema)

    await deleteReleaseService(req.user, modelId, semver)
    await audit.onDeleteRelease(req, modelId, semver)

    return res.json({
      message: 'Successfully removed release.',
    })
  },
]
