import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { listModelImagesWithScanResults } from '../../../../services/registry.js'
import { imageWithScanResultsSchema, registerPath } from '../../../../services/specification.js'
import { ModelImagesWithOptionalScanResults } from '../../../../types/types.js'
import { parse, strictCoerceBoolean } from '../../../../utils/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  query: z.object({
    includeCount: strictCoerceBoolean(z.boolean().optional().default(false)),
    includeSummary: strictCoerceBoolean(z.boolean().optional().default(false)),
    includeFullDetail: strictCoerceBoolean(z.boolean().optional().default(false)),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/images',
  tags: ['image'],
  description: 'Get all of the images associated with a model, optionally with scan results.',
  schema: getImagesSchema,
  responses: {
    200: {
      description: 'An array of images associated with the model.',
      content: {
        'application/json': {
          schema: z.object({
            images: z.array(imageWithScanResultsSchema),
          }),
        },
      },
    },
  },
})

interface GetImagesResponse {
  images: ModelImagesWithOptionalScanResults[]
}

export const getImages = [
  async (req: Request, res: Response<GetImagesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewModelImages
    const {
      params: { modelId },
      query: { includeCount, includeSummary, includeFullDetail },
    } = parse(req, getImagesSchema)

    const images = await listModelImagesWithScanResults(
      req.user,
      modelId,
      includeCount,
      includeSummary,
      includeFullDetail,
    )
    await audit.onViewModelImages(req, modelId, images)

    res.json({
      images,
    })
  },
]
