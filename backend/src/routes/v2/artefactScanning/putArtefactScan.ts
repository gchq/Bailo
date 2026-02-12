import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { rerunArtefactScan } from '../../../services/scan.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putArtefactScanSchema = z.object({
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
  description: 'Manually re-request a new antivirus scan for an artefact',
  schema: putArtefactScanSchema,
  responses: {
    200: {
      description: ``,
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'Artefact scan started' }),
          }),
        },
      },
    },
  },
})

interface PutArtefactScanResponse {
  status: string
}

export const putArtefactScan = [
  async (req: Request, res: Response<PutArtefactScanResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateFile
    const {
      params: { modelId, fileId: artefactId },
    } = parse(req, putArtefactScanSchema)

    await rerunArtefactScan(req.user, modelId, artefactId)

    await audit.onUpdateFile(req, modelId, artefactId)

    res.json({
      status: 'Scan started',
    })
  },
]
