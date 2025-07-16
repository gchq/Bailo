import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { Role, RoleKind } from '../../../../types/types.js'
import config from '../../../../utils/config.js'

interface GetSystemRolesResponse {
  roles: Array<Role>
}

export const getSystemRoles = [
  bodyParser.json(),
  async (_req: Request, res: Response<GetSystemRolesResponse>): Promise<void> => {
    res.json({
      roles: [
        {
          id: 'consumer',
          name: `${config.ui.roleDisplayNames.consumer}`,
          kind: RoleKind.ENTRY,
          description:
            'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
        },
        {
          id: 'contributor',
          name: `${config.ui.roleDisplayNames.contributor}`,
          kind: RoleKind.ENTRY,
          description: 'This role allows users edit the model card and draft releases.',
        },
        {
          id: 'owner',
          name: `${config.ui.roleDisplayNames.owner}`,
          kind: RoleKind.ENTRY,
          description: 'This role includes all permissions, such as managing model access and model deletion.',
        },
      ],
    })
  },
]
