import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { Role, RoleKind } from '../../../../types/types.js'

interface GetModelCurrentUserRolesResponse {
  roles: Array<Role>
}

// TODO check this is still being used
export const getAllModelReviewRoles = [
  bodyParser.json(),
  async (_req: Request, res: Response<GetModelCurrentUserRolesResponse>) => {
    return res.json({
      roles: [
        {
          name: 'Model Senior Responsible Officer',
          short: 'MSRO',
          kind: RoleKind.SCHEMA,
          description: 'This role is specified by the schema in accordance with its policy.',
        },
        {
          name: 'Model Technical Reviewer',
          short: 'MTR',
          kind: RoleKind.SCHEMA,
          description: 'This role is specified by the schema in accordance with its policy.',
        },
      ],
    })
  },
]
