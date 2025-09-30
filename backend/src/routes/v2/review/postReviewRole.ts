import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SystemRoles } from '../../../models/Model.js'
import { ReviewRoleInterface } from '../../../models/ReviewRole.js'
import { createReviewRole } from '../../../services/review.js'
import { registerPath, reviewRoleSchema } from '../../../services/specification.js'
import { RoleKind } from '../../../types/types.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const postReviewRoleSchema = z.object({
  body: z.object({
    name: z.string().openapi({ example: 'Reviewer' }),
    shortName: z.string().openapi({ example: 'reviewer' }),
    kind: z.enum(getEnumValues(RoleKind)).exclude([RoleKind.SYSTEM]).openapi({ example: RoleKind.REVIEW }),
    description: z.string().optional().openapi({ example: 'This is an example review role' }),
    defaultEntities: z
      .array(z.string())
      .optional()
      .openapi({ example: ['user:user'] }),
    lockEntities: z.boolean().optional().openapi({ example: false }),
    systemRole: z.nativeEnum(SystemRoles).optional().openapi({ example: SystemRoles.Owner }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/review/role',
  tags: ['review role'],
  description:
    'Used for creating a new review role. Note - dynamic review roles are currently WIP and might not be fully functional.',
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
  async (req: Request, res: Response<PostReviewRoleResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateReviewRole

    const { body } = parse(req, postReviewRoleSchema)

    const reviewRole = await createReviewRole(req.user, body)
    await audit.onCreateReviewRole(req, reviewRole)

    res.json({ reviewRole })
  },
]
