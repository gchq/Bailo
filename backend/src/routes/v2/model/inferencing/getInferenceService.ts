import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { InferenceInterface } from '../../../../models/v2/Inference.js'
import { getInferenceByImage } from '../../../../services/v2/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getInferenceSchema = z.object({
  params: z.object({
    modelId: z.string(),
    image: z.string(),
    tag: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/inference/{image}/{tag}',
  tags: ['inference'],
  description: 'Get details for an inferencing service within the cluster.',
  schema: getInferenceSchema,
  responses: {
    200: {
      description: 'Details for a specific inferencing instance.',
      content: {
        'application/json': {
          schema: z.object({ inference: inferenceInterfaceSchema }),
        },
      },
    },
  },
})

interface GetInferenceService {
  inference: InferenceInterface
}

export const getInference = [
  bodyParser.json(),
  async (req: Request, res: Response<GetInferenceService>) => {
    req.audit = AuditInfo.ViewInference
    const {
      params: { modelId, image, tag },
    } = parse(req, getInferenceSchema)

    const inference = await getInferenceByImage(req.user, modelId, image, tag)

    await audit.onViewInference(req, inference)

    return res.json({
      inference,
    })
  },
]
