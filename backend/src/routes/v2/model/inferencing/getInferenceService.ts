import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { InferenceInterface } from '../../../../models/v2/Inference.js'
import { getInferencesByModel } from '../../../../services/v2/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getInferenceSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/inferences',
  tags: ['inference'],
  description: 'Get all of the inferencing services associated with a model.',
  schema: getInferenceSchema,
  responses: {
    200: {
      description: 'An array of inferencing services.',
      content: {
        'application/json': {
          schema: z.object({
            inferences: z.array(inferenceInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetInferenceService {
  inferences: Array<InferenceInterface>
}

export const getInferences = [
  bodyParser.json(),
  async (req: Request, res: Response<GetInferenceService>) => {
    const { params } = parse(req, getInferenceSchema)

    const inferences = await getInferencesByModel(req.user, params.modelId)
    return res.json({
      inferences,
    })
  },
]
