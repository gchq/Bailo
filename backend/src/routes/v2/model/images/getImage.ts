import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { getImageWithScanResults } from '../../../../services/registry.js'
import { imageTagWithScanResultsSchema, registerPath } from '../../../../services/specification.js'
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
  query: z.object({
    platform: z.string().optional(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/image/{name}/{tag}',
  tags: ['image'],
  description: 'Get information associated with a specific tagged image for a model.',
  schema: getImageSchema,
  responses: {
    200: {
      description: 'An image associated with the model.',
      content: {
        'application/json': {
          schema: z.object({
            imageBreakdown: imageTagWithScanResultsSchema,
          }),
        },
      },
    },
  },
})

interface GetImagesResponse {
  imageBreakdown: ImageTagResult
}

export const getImage = [
  async (req: Request, res: Response<GetImagesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewModelImage
    const {
      params: { modelId, name, tag },
      query: { platform },
    } = parse(req, getImageSchema)
    const imageBreakdown = await getImageWithScanResults(req.user, { repository: modelId, name, tag }, true, platform)
    await audit.onViewModelImage(req, modelId, name, tag)

    res.json({
      imageBreakdown,
    })
  },
]
