import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Role } from '../../../../types/v2/types.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getModelCurrentUserRolesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetModelCurrentUserRolesResponse {
  roles: Array<Role>
}

export const getModelCurrentUserRoles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCurrentUserRolesResponse>) => {
    const _ = parse(req, getModelCurrentUserRolesSchema)

    return res.json({
      roles: [
        {
          id: 'msro',
          name: 'Model Senior Responsible Officer',
          short: 'MSRO',
        },
        {
          id: 'mtr',
          name: 'Model Technical Reviewer',
          short: 'MTR',
        },
        {
          id: 'consumer',
          name: 'Consumer',
        },
        {
          id: 'contributor',
          name: 'Contributor',
        },
        {
          id: 'owner',
          name: 'Owner',
        },
      ],
    })
  },
]
