import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { EntryKind, EntryKindKeys, ModelInterface } from '../../../models/Model.js'
import { getModelById } from '../../../services/model.js'
import { modelInterfaceSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelSchema = z.object({
  params: z.object({
    modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  }),
  query: z.object({
    kind: z.string(z.nativeEnum(EntryKind)).optional(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}',
  tags: ['model'],
  description: "Get a model by it's ID",
  schema: getModelSchema,
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

interface GetModelResponse {
  model: ModelInterface
}

export const getModel = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelResponse>) => {
    req.audit = AuditInfo.ViewModel
    const { params, query } = parse(req, getModelSchema)

    const model = await getModelById(req.user, params.modelId, query.kind as EntryKindKeys | undefined)

    await audit.onViewModel(req, model)

    return res.json({
      model,
    })
  },
]
