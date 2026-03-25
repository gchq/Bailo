import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { SystemRoles } from '../../../../models/Model.js'
import { getAllEntryRoles } from '../../../../services/roles.js'
import { registerPath } from '../../../../services/specification.js'
import { RoleKind } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getModelRolesSchema = z.object({
  query: z.object({
    modelId: z.string().optional().openapi({ example: 'model-0qjrad' }),
  }),
})

const GetModelRolesResponseSchema = z.object({
  roles: z.array(
    z.object({
      name: z.string().min(1),
      kind: z.nativeEnum(RoleKind),
      shortName: z.string(),
      description: z.string().optional(),
      SystemRole: z.nativeEnum(SystemRoles).optional(),
    }),
  ),
})

registerPath({
  method: 'get',
  path: '/api/v2/roles',
  tags: ['model'],
  description: 'Get the roles available to be used on an entry. Includes both system and dynamic roles.',
  schema: getModelRolesSchema,
  responses: {
    200: {
      description: 'An array of roles..',
      content: {
        'application/json': {
          schema: GetModelRolesResponseSchema,
        },
      },
    },
  },
})

export type ModelScanResponseSchema = z.infer<typeof GetModelRolesResponseSchema>

export const getModelRoles = [
  async (req: Request, res: Response<z.infer<typeof GetModelRolesResponseSchema>>) => {
    req.audit = AuditInfo.ViewReviewRoles
    const {
      query: { modelId },
    } = parse(req, getModelRolesSchema)

    const allRoles = await getAllEntryRoles(req.user, modelId)

    await audit.onViewReviewRoles(req, allRoles)

    res.json({
      roles: allRoles,
    })
  },
]
