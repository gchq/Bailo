import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReviewRoleInterface } from '../../../models/ReviewRole.js'
import { findReviewRoles } from '../../../services/review.js'
import { registerPath, reviewRoleSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getReviewRolesSchema = z.object({
  query: z.object({
    schemaId: z
      .string()
      .optional()
      .openapi({ example: 'Filter review roles to those only found within a specific schema.' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/review/roles',
  tags: ['review'],
  description:
    'Fetch all review roles. Note - dynamic review roles are currently WIP and might not be fully functional.',
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
    req.audit = AuditInfo.ViewReviewRoles
    const {
      query: { schemaId },
    } = parse(req, getReviewRolesSchema)
    const reviewRoles = await findReviewRoles(schemaId)
    await audit.onViewReviewRoles(req, reviewRoles)
    res.setHeader('x-count', reviewRoles.length)
    return res.json({ reviewRoles })
  },
]
