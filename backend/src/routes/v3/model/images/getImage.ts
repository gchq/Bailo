import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { getModelImageWithScanResults } from '../../../../services/registry.js'
import { imageTagWithScanResultsSchema, PathConfig, registerPath } from '../../../../services/specification.js'
import { ImageTagResult } from '../../../../types/types.js'
import { parse } from '../../../../utils/validate.js'

const getImageByDigestParams = z.object({
  modelId: z.string({
    required_error: 'Must specify model id as param',
  }),
  name: z.string({
    required_error: 'Must specify image name as param',
  }),
  tag: z.string({
    required_error: 'Must specify image tag as param',
  }),
  digest: z.string({
    required_error: 'Must specify image digest as param',
  }),
})

export const getImageByDigestSchema = z.object({ params: getImageByDigestParams })

const pathSpec: Omit<PathConfig, 'path' | 'description' | 'schema'> = {
  method: 'get',
  tags: ['image'],
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
}

registerPath(
  {
    ...pathSpec,
    schema: getImageByDigestSchema,
    description: 'Get information associated with a specific tagged image and digest for a model.',
    path: '/api/v3/model/{modelId}/image/{name}/{tag}/{digest}',
  },
  'v3',
)
interface GetImagesResponse {
  imageBreakdown: ImageTagResult
}

export const getImageByDigest = [
  async (req: Request, res: Response<GetImagesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewModelImage
    const {
      params: { modelId, name, tag, digest },
    } = parse(req, getImageByDigestSchema)
    const imageBreakdown = await getModelImageWithScanResults(req.user, { repository: modelId, name, tag }, digest)
    await audit.onViewModelImage(req, modelId, name, tag)

    res.json({
      imageBreakdown,
    })
  },
]
