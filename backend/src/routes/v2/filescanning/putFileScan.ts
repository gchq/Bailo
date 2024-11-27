import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { rerunFileScan } from '../../../services/file.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putFileScanSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/filescanning/model/{modelId}/file/{fileId}/scan',
  tags: ['filescanning'],
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
  bodyParser.json(),
  async (req: Request, res: Response<PutFileScanResponse>) => {
    const {
      params: { modelId, fileId },
    } = parse(req, putFileScanSchema)

    await rerunFileScan(req.user, modelId, fileId)

    return res.json({
      status: 'Scan started',
    })
  },
]
