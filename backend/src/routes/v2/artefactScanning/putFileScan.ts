import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { rerunFileScan } from '../../../services/scan.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putFileScanSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
  body: z.object({}),
})

registerPath({
  method: 'put',
  path: '/api/v2/filescanning/model/{modelId}/file/{fileId}/scan',
  tags: ['artefact-scanning'],
  description: 'Manually re-request a new antivirus scan for a file',
  schema: putFileScanSchema,
  responses: {
    200: {
      description: ``,
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'File scan started' }),
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
      params: { modelId, fileId },
    } = parse(req, putFileScanSchema)

    await rerunFileScan(req.user, modelId, fileId)

    await audit.onUpdateFile(req, modelId, fileId)

    res.json({
      status: 'Scan started',
    })
  },
]
