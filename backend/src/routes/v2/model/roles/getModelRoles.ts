import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

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
  bodyParser.json(),
  async (req: Request, res: Response<GetModelRolesResponse>) => {
    const {
      query: { modelId },
    } = parse(req, getModelRolesSchema)

    const allRoles = await getAllEntryRoles(req.user, modelId)

    res.json({
      roles: allRoles,
    })
  },
]
