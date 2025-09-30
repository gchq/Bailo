import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { InferenceInterface } from '../../../../models/Inference.js'
import { createInference } from '../../../../services/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/specification.js'
import config from '../../../../utils/config.js'
import { parse } from '../../../../utils/validate.js'

export const postInferenceSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    image: z.string(),
    tag: z.string(),
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
    method: 'post',
    path: '/api/v2/model/{modelId}/inference',
    tags: ['inference'],
    description: 'Create a inferencing service within Bailo',
    schema: postInferenceSchema,
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

interface PostInferenceService {
  inference: InferenceInterface
}

export const postInference = [
  async (req: Request, res: Response<PostInferenceService>): Promise<void> => {
    req.audit = AuditInfo.CreateInference
    const {
      params: { modelId },
      body,
    } = parse(req, postInferenceSchema)

    const inference = await createInference(req.user, modelId, body)

    await audit.onCreateInference(req, inference)

    res.json({
      inference,
    })
  },
]
