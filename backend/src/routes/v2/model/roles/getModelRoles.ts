import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Role, RoleKind } from '../../../../types/types.js'
import config from '../../../../utils/config.js'
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
  async (req: Request, res: Response<GetModelRolesResponse>): Promise<void> => {
    const {
      query: { modelId },
    } = parse(req, getModelRolesSchema)

    let modelRoles: Role[] = []

    if (modelId) {
      modelRoles = [
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
      ]
    }

    res.json({
      roles: [
        ...modelRoles,
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
