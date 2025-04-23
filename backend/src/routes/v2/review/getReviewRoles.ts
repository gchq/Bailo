import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReviewRoleInterface } from '../../../models/ReviewRole.js'
import { findReviewRoles } from '../../../services/review.js'
import { registerPath, reviewRoleSchema } from '../../../services/specification.js'

export const getReviewRolesSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/review/roles',
  tags: ['review'],
  description: 'Fetch all review roles',
  schema: getReviewRolesSchema,
  responses: {
    200: {
      description: 'An array of review roles.',
      content: {
        'application/json': {
          schema: z.object({
            reviews: z.array(reviewRoleSchema),
          }),
        },
      },
    },
  },
})

interface GetReviewRolesResponse {
  reviewRoles: Array<ReviewRoleInterface>
}

export const getReviewRoles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewRolesResponse>) => {
    req.audit = AuditInfo.ViewReviewRole
    const reviewRoles = await findReviewRoles()
    await audit.onViewReviewRoles(req, reviewRoles)
    res.setHeader('x-count', reviewRoles.length)
    return res.json({ reviewRoles })
  },
]
