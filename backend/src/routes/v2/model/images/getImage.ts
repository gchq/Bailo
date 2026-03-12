import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { getImageWithScanResults } from '../../../../services/registry.js'
import { imageWithScanResultsSchema, registerPath } from '../../../../services/specification.js'
import { ImageTagResult } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getImageSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    name: z.string({
      required_error: 'Must specify image name as param',
    }),
    tag: z.string({
      required_error: 'Must specify image tag as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/image/{name}/{tag}',
  tags: ['image'],
  description: 'Get information associated with a specific tagged image for a model, optionally with scan results.',
  schema: getImageSchema,
  responses: {
    200: {
      description: 'A image associated with the model.',
      content: {
        'application/json': {
          schema: z.object({
            images: imageWithScanResultsSchema,
          }),
        },
      },
    },
  },
})

interface GetImagesResponse {
  image: ImageTagResult
}

export const getImage = [
  async (req: Request, res: Response<GetImagesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewModelImage
    const {
      params: { modelId, name, tag },
    } = parse(req, getImageSchema)

    const image = await getImageWithScanResults(req.user, { repository: modelId, name, tag }, true)
    await audit.onViewModelImage(req, modelId, image)

    res.json({
      image,
    })
  },
]
