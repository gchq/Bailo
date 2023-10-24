import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface } from '../../../models/v2/Model.js'
import { getModelById } from '../../../services/v2/model.js'
import { errorSchemaContent, modelInterfaceSchema, registry } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelSchema = z.object({
  params: z.object({
    modelId: z
      .string({
        required_error: 'Must specify model id as param',
      })
      .openapi({ example: 'yolo-v4-abcdef' }),
  }),
})

registry.registerPath({
  method: 'get',
  path: 'api/v2/model/{modelId}',
  tags: ['model'],
  description: "Get a model by it's ID",
  request: {
    params: getModelSchema.shape.params,
  },
  responses: {
    200: {
      description: 'Object with model information.',
      content: {
        'application/json': {
          schema: modelInterfaceSchema,
        },
      },
    },
    403: {
      description: 'Permission denied',
      content: errorSchemaContent,
    },
    404: {
      description: 'Model not found',
      content: errorSchemaContent,
    },
  },
})

interface GetModelResponse {
  model: ModelInterface
}

export const getModel = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelResponse>) => {
    const { params } = parse(req, getModelSchema)

    const model = await getModelById(req.user, params.modelId)

    return res.json({
      model,
    })
  },
]
