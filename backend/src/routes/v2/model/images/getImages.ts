import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { listModelImagesWithScanResults } from '../../../../services/registry.js'
import { imageWithScanResultsSchema, registerPath } from '../../../../services/specification.js'
import { ImageScanDetail, ModelImages } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  query: z.object({
    scanDetail: z.nativeEnum(ImageScanDetail).optional().default(ImageScanDetail.NONE),
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
  images: ModelImages
}

export const getImages = [
  async (req: Request, res: Response<GetImagesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewModelImages
    const {
      params: { modelId },
      query: { scanDetail },
    } = parse(req, getImagesSchema)

    const images = await listModelImagesWithScanResults(req.user, modelId, scanDetail)
    await audit.onViewModelImages(req, modelId, images)

    res.json({
      images,
    })
  },
]
