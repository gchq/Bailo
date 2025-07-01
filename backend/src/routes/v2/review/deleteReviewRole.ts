import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { removeReviewRole } from '../../../services/review.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const deleteReviewRoleSchema = z.object({
  params: z.object({
    reviewRoleId: z.string().openapi({ example: 'reviewer' }),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/review/role/{reviewRoleId}',
  tags: ['review'],
  description: 'Used for deleting a review role.',
  schema: deleteReviewRoleSchema,
  responses: {
    200: {
      description: 'A review role',
      content: {
        'application/json': {
          schema: z.object({
            deleted: z.boolean(),
          }),
        },
      },
    },
  },
})

interface DeleteReviewRoleResponse {
  deleted: true
}

export const deleteReviewRole = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteReviewRoleResponse>) => {
    req.audit = AuditInfo.DeleteReviewRole

    const { params } = parse(req, deleteReviewRoleSchema)

    await removeReviewRole(req.user, params.reviewRoleId)
    await audit.onDeleteReviewRole(req, params.reviewRoleId)

    return res.json({ deleted: true })
  },
]
