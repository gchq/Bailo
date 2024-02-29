import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ModelInterface } from '../../../models/v2/Model.js'
import { getModelById } from '../../../services/v2/model.js'
import { modelInterfaceSchema, registerPath } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const getModelSchema = z.object({
  params: z.object({
    modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
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
    const { params } = parse(req, getModelSchema)

    const model = await getModelById(req.user, params.modelId)

    await audit.onViewModel(req, model)

    return res.json({
      model,
    })
  },
]
