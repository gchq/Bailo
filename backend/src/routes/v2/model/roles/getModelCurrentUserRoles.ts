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

export const getModelCurrentUserRoles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCurrentUserRolesResponse>): Promise<void> => {
    const _ = parse(req, getModelCurrentUserRolesSchema)

    res.json({
      roles: [
        {
          id: 'msro',
          name: 'Model Senior Responsible Officer',
          short: 'MSRO',
          kind: RoleKind.SCHEMA,
          description: 'This role is specified by the schema in accordance with its policy.',
        },
        {
          id: 'mtr',
          name: 'Model Technical Reviewer',
          short: 'MTR',
          kind: RoleKind.SCHEMA,
          description: 'This role is specified by the schema in accordance with its policy.',
        },
        {
          id: 'consumer',
          name: 'Consumer',
          kind: RoleKind.ENTRY,
          description:
            'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
        },
        {
          id: 'contributor',
          name: 'Contributor',
          kind: RoleKind.ENTRY,
          description: 'This role allows users edit the model card and draft releases.',
        },
        {
          id: 'owner',
          name: 'Owner',
          kind: RoleKind.ENTRY,
          description: 'This role includes all permissions, such as managing model access and model deletion.',
        },
      ],
    })
  },
]
