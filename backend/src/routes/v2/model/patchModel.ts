import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { EntryKind, EntryVisibility, ModelInterface } from '../../../models/Model.js'
import { updateModel } from '../../../services/model.js'
import { modelInterfaceSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchModelSchema = z.object({
  body: z.object({
    name: z.string().optional().openapi({ example: 'Yolo v4' }),
    kind: z.nativeEnum(EntryKind).optional().openapi({ example: EntryKind.Model }),
    description: z.string().optional().openapi({ example: 'You only look once' }),
    visibility: z.nativeEnum(EntryVisibility).optional().openapi({ example: 'private' }),
    settings: z
      .object({
        ungovernedAccess: z.boolean().optional().openapi({ example: true }),
        mirror: z
          .object({
            sourceModelId: z.string().optional().openapi({ example: 'yolo-v4-abcdef' }),
            destinationModelId: z.string().optional().openapi({ example: 'yolo-v4-abcdef' }),
          })
          .optional(),
      })
      .optional(),
    collaborators: z
      .array(
        z.object({
          entity: z.string().openapi({ example: 'user:user' }),
          roles: z.array(z.string()).openapi({ example: ['owner', 'contributor'] }),
        }),
      )
      .optional(),
  }),
  params: z.object({
    modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}',
  tags: ['model'],
  description: 'Patch the values of a model',
  schema: patchModelSchema,
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

interface PatchModelResponse {
  model: ModelInterface
}

export const patchModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchModelResponse>) => {
    req.audit = AuditInfo.UpdateModel
    const {
      body,
      params: { modelId },
    } = parse(req, patchModelSchema)

    const model = await updateModel(req.user, modelId, body)
    await audit.onUpdateModel(req, model)

    return res.json({
      model,
    })
  },
]
