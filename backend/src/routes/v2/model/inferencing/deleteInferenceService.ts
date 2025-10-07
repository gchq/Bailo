import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { InferenceInterface } from '../../../../models/Inference.js'
import { removeInference } from '../../../../services/inference.js'
import { inferenceInterfaceSchema, registerPath } from '../../../../services/specification.js'
import config from '../../../../utils/config.js'
import { parse } from '../../../../utils/validate.js'

export const deleteInferenceSchema = z.object({
  params: z.object({
    modelId: z.string().min(1),
    image: z.string().min(1),
    tag: z.string().min(1),
  }),
})

if (config.ui?.inference?.enabled) {
  registerPath({
    method: 'delete',
    path: '/api/v2/model/{modelId}/inference/{image}/{tag}',
    tags: ['inference'],
    description: 'Delete an inferencing service within Bailo',
    schema: deleteInferenceSchema,
    responses: {
      200: {
        description: 'Confirmation of deleted inferencing service.',
        content: {
          'application/json': {
            schema: inferenceInterfaceSchema,
          },
        },
      },
    },
  })
}

interface DeleteInferenceService {
  inference: InferenceInterface
}

export const deleteInference = [
  async (req: Request, res: Response<DeleteInferenceService>): Promise<void> => {
    req.audit = AuditInfo.DeleteInference
    const {
      params: { modelId, image, tag },
    } = parse(req, deleteInferenceSchema)

    const inference = await removeInference(req.user, modelId, image, tag)

    await audit.onDeleteInference(req, inference)

    res.json({
      inference,
    })
  },
]
