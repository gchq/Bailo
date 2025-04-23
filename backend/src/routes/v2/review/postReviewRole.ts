import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { CollaboratorRoles } from '../../../models/Model.js'
import { ReviewRoleInterface } from '../../../models/ReviewRole.js'
import { createReviewRole } from '../../../services/review.js'
import { registerPath, reviewRoleSchema } from '../../../services/specification.js'
import { RoleKind } from '../../../types/types.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const postReviewRoleSchema = z.object({
  body: z.object({
    id: z.string().openapi({ example: 'reviewer' }),
    name: z.string().openapi({ example: 'Reviewer' }),
    short: z.string().openapi({ example: 'reviewer' }),
    kind: z.enum(getEnumValues(RoleKind)).exclude([RoleKind.ENTRY]).openapi({ example: RoleKind.SCHEMA }),
    description: z.string().optional().openapi({ example: 'This is an example review role' }),
    defaultEntities: z
      .array(z.string())
      .optional()
      .openapi({ example: ['user:user'] }),
    lockEntities: z.boolean().optional().openapi({ example: false }),
    CollaboratorRoles: z.string().optional().openapi({ example: CollaboratorRoles.Owner }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/review/role',
  tags: ['review'],
  description: 'Used for creating a new review role.',
  schema: postReviewRoleSchema,
  responses: {
    200: {
      description: 'A review role',
      content: {
        'application/json': {
          schema: z.object({
            reviewRoleSchema,
          }),
        },
      },
    },
  },
})

interface PostReviewRoleResponse {
  reviewRole: ReviewRoleInterface
}

export const postReviewRole = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReviewRoleResponse>) => {
    req.audit = AuditInfo.CreateReviewRole

    const { body } = parse(req, postReviewRoleSchema)

    const reviewRole = await createReviewRole(req.user, body)
    console.log(reviewRole)
    await audit.onCreateReviewRole(req, reviewRole.id)

    return res.json({ reviewRole })
  },
]
