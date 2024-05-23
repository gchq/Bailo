import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { EntryKind, EntryVisibility, ModelInterface } from '../../../models/Model.js'
import { createModel } from '../../../services/model.js'
import { modelInterfaceSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postModelSchema = z.object({
  body: z.object({
    name: z.string(),
    kind: z.nativeEnum(EntryKind),
    teamId: z.string(),
    description: z.string(),
    visibility: z.nativeEnum(EntryVisibility).optional().default(EntryVisibility.Public),
    settings: z
      .object({
        ungovernedAccess: z.boolean().optional().default(false).openapi({ example: true }),
        mirror: z.object({
          sourceModelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
          destinationModelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
        }),
      })
      .optional()
      .default({ ungovernedAccess: false, mirror: { sourceModelId: '', destinationModelId: '' } }),
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
