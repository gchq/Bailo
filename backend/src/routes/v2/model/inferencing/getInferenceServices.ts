import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { InferenceInterface } from '../../../../models/Inference.js'
import { getInferencesByModel } from '../../../../services/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/specification.js'
import config from '../../../../utils/config.js'
import { parse } from '../../../../utils/validate.js'

export const getInferencesSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})
if (config.ui?.inference?.enabled) {
  registerPath({
    method: 'get',
    path: '/api/v2/model/{modelId}/inferences',
    tags: ['inference'],
    description: 'Get all of the inferencing services associated with a model.',
    schema: getInferencesSchema,
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
}

interface GetInferenceService {
  inferences: Array<InferenceInterface>
}

export const getInferences = [
  bodyParser.json(),
  async (req: Request, res: Response<GetInferenceService>) => {
    req.audit = AuditInfo.ViewInferences
    const { params } = parse(req, getInferencesSchema)

    const inferences = await getInferencesByModel(req.user, params.modelId)

    await audit.onViewInferences(req, inferences)

    return res.json({
      inferences,
    })
  },
]
