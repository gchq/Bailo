import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Role, RoleKind } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

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

// TODO is this still being used?
export const getModelCurrentUserRoles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCurrentUserRolesResponse>) => {
    const _ = parse(req, getModelCurrentUserRolesSchema)

    return res.json({
      roles: [
        {
          short: 'consumer',
          name: 'Consumer',
          kind: RoleKind.ENTRY,
          description:
            'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
        },
        {
          short: 'contributor',
          name: 'Contributor',
          kind: RoleKind.ENTRY,
          description: 'This role allows users edit the model card and draft releases.',
        },
        {
          short: 'owner',
          name: 'Owner',
          kind: RoleKind.ENTRY,
          description: 'This role includes all permissions, such as managing model access and model deletion.',
        },
      ],
    })
  },
]
