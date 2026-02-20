import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { rerunImageScan } from '../../../services/scan.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putFileScanSchema = z.object({
  params: z.object({
    modelId: z.string(),
    name: z.string(),
    tag: z.string(),
  }),
  body: z.object({}),
})

registerPath({
  method: 'put',
  path: '/api/v2/artefactscanning/model/{modelId}/image/{name}/{tag}/scan',
  tags: ['artefact-scanning'],
  description: 'Manually re-request a new scan for an image',
  schema: putFileScanSchema,
  responses: {
    200: {
      description: ``,
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'Image scan started' }),
          }),
        },
      },
    },
  },
})

interface PutFileScanResponse {
  status: string
}

export const putFileScan = [
  async (req: Request, res: Response<PutFileScanResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateFile
    const {
      params: { modelId, name, tag },
    } = parse(req, putFileScanSchema)
    const imageRef = { repository: modelId, name, tag }

    await rerunImageScan(req.user, modelId, imageRef)

    await audit.onUpdateImage(req, modelId, imageRef)

    res.json({
      status: 'Scan started',
    })
  },
]
