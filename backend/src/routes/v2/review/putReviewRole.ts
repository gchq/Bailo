import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import z from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { CollaboratorRoles } from '../../../models/Model.js'
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
      name: z.string().openapi({ example: 'Reviewer' }),
      description: z.string().openapi({ example: 'This is an example review role' }).optional(),
      defaultEntities: z
        .array(z.string())
        .openapi({ example: ['user:user'] })
        .optional(),
      collaboratorRole: z.nativeEnum(CollaboratorRoles).optional().openapi({ example: CollaboratorRoles.Owner }),
    })
    .strict(),
})

registerPath({
  method: 'put',
  path: '/api/v2/role/{shortName}',
  tags: ['reviewRole'],
  description: 'Update partial fields for an review role.',
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
