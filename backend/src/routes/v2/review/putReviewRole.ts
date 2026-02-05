import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { SystemRoles } from '../../../models/Model.js'
import { ReviewRoleInterface } from '../../../models/ReviewRole.js'
import { updateReviewRole } from '../../../services/review.js'
import { registerPath, reviewRoleSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putReviewRoleSchema = z.object({
  params: z.object({
    shortName: z.string({
      required_error: 'Must specify review role short name as URL parameter',
    }),
  }),
  body: z
    .object({
      name: z.string().min(1).openapi({ example: 'Reviewer' }),
      description: z.string().openapi({ example: 'This is an example review role' }).optional(),
      defaultEntities: z
        .array(z.string())
        .openapi({ example: ['user:user'] })
        .optional(),
      systemRole: z.nativeEnum(SystemRoles).optional().openapi({ example: SystemRoles.Owner }),
    })
    .strict(),
})

registerPath({
  method: 'put',
  path: '/api/v2/review/role/{shortName}',
  tags: ['review role'],
  description: 'Update an existing review role.',
  schema: putReviewRoleSchema,
  responses: {
    200: {
      description: 'Object with review role properties',
      content: {
        'application/json': {
          schema: z.object({
            reviewRole: reviewRoleSchema,
          }),
        },
      },
    },
  },
})

interface PutReviewRoleResponse {
  reviewRole: ReviewRoleInterface
}

export const putReviewRole = [
  bodyParser.json(),
  async (req: Request, res: Response<PutReviewRoleResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateReviewRole
    const { body, params } = parse(req, putReviewRoleSchema)
    const reviewRole = await updateReviewRole(req.user, params.shortName, body)
    await audit.onUpdateReviewRole(req, reviewRole)

    res.json({
      reviewRole,
    })
  },
]
