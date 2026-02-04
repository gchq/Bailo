import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { getAllEntryRoles } from '../../../../services/roles.js'
import { Role } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getModelRolesSchema = z.object({
  query: z.object({
    modelId: z.string().optional().openapi({ example: 'model-0qjrad' }),
  }),
})

interface GetModelRolesResponse {
  roles: Array<Role>
}

export const getModelRoles = [
  async (req: Request, res: Response<GetModelRolesResponse>) => {
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
