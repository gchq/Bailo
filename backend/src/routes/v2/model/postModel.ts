import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ModelInterface, ModelVisibility } from '../../../models/Model.js'
import { createModel } from '../../../services/v2/model.js'
import { modelInterfaceSchema, registerPath } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const postModelSchema = z.object({
  body: z.object({
    name: z.string(),
    teamId: z.string(),
    description: z.string(),
    visibility: z.nativeEnum(ModelVisibility).optional().default(ModelVisibility.Public),
    settings: z
      .object({
        ungovernedAccess: z.boolean().optional().default(false).openapi({ example: true }),
      })
      .optional(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/models',
  tags: ['model'],
  description: 'Create a new model instance',
  schema: postModelSchema,
  responses: {
    200: {
      description: 'Object with model information.',
      content: {
        'application/json': {
          schema: z.object({ model: modelInterfaceSchema }),
        },
      },
    },
  },
})

interface PostModelResponse {
  model: ModelInterface
}

export const postModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PostModelResponse>) => {
    req.audit = AuditInfo.CreateModel
    const { body } = parse(req, postModelSchema)

    const model = await createModel(req.user, body)

    await audit.onCreateModel(req, model)

    return res.json({ model })
  },
]
