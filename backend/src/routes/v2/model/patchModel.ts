import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'
import { updateModel } from '../../../services/v2/model.js'
import { parse } from '../../../utils/validate.js'

export const patchModelSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    visibility: z.nativeEnum(ModelVisibility).optional(),
    collaborators: z
      .array(
        z.object({
          entity: z.string(),
          roles: z.array(z.string()),
        }),
      )
      .optional(),
  }),
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

interface PatchModelResponse {
  model: ModelInterface
}

export const patchModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchModelResponse>) => {
    const {
      body,
      params: { modelId },
    } = parse(req, patchModelSchema)

    const model = await updateModel(req.user, modelId, body)

    return res.json({
      model,
    })
  },
]
