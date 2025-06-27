import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { getAllEntryRoles } from '../../../../services/roles.js'
import { Role } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getModelRolesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetModelRolesResponse {
  roles: Array<Role>
}

export const getModelRoles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelRolesResponse>) => {
    const _ = parse(req, getModelRolesSchema)

    const allRoles = await getAllEntryRoles()

    return res.json({
      roles: allRoles,
    })
  },
]
