import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { InferenceInterface, ProcessorType } from '../../../../models/v2/Inference.js'
import { updateInference } from '../../../../services/v2/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

export const putInferenceSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    image: z.string(),
    tag: z.string(),
    description: z.string(),
    settings: z.object({
      processorType: z.nativeEnum(ProcessorType),
      memory: z.number().optional(),
      port: z.number(),
    }),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/model/{modelId}/inference',
  tags: ['inference'],
  description: 'Update a inferencing service within Bailo',
  schema: putInferenceSchema,
  responses: {
    200: {
      description: 'The created inferencing service.',
      content: {
        'application/json': {
          schema: inferenceInterfaceSchema,
        },
      },
    },
  },
})

interface PutInferenceService {
  inference: InferenceInterface
}

export const putInference = [
  bodyParser.json(),
  async (req: Request, res: Response<PutInferenceService>) => {
    const {
      params: { modelId },
      body,
    } = parse(req, putInferenceSchema)

    const inference = await updateInference(req.user, modelId, body)
    return res.json({
      inference,
    })
  },
]
