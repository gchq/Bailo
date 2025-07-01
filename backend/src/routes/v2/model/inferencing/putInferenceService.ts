import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { InferenceInterface } from '../../../../models/Inference.js'
import { updateInference } from '../../../../services/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/specification.js'
import config from '../../../../utils/config.js'
import { parse } from '../../../../utils/validate.js'

export const putInferenceSchema = z.object({
  params: z.object({
    modelId: z.string(),
    image: z.string(),
    tag: z.string(),
  }),
  body: z.object({
    description: z.string(),
    settings: z.object({
      processorType: z.string(),
      memory: z.number().optional(),
      port: z.number(),
    }),
  }),
})
if (config.ui?.inference?.enabled) {
  registerPath({
    method: 'put',
    path: '/api/v2/model/{modelId}/inference/{image}/{tag}',
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
}

interface PutInferenceService {
  inference: InferenceInterface
}

export const putInference = [
  bodyParser.json(),
  async (req: Request, res: Response<PutInferenceService>): Promise<void> => {
    req.audit = AuditInfo.UpdateInference
    const {
      params: { modelId, image, tag },
      body,
    } = parse(req, putInferenceSchema)

    const inference = await updateInference(req.user, modelId, image, tag, body)

    await audit.onUpdateInference(req, inference)

    res.json({
      inference,
    })
  },
]
