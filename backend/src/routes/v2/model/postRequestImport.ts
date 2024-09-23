import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { importModel } from '../../../services/mirroredModel.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postRequestImportFromS3Schema = z.object({
  body: z.object({
    payloadUrl: z.string(),
    mirroredModelId: z.string(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/import/s3',
  tags: ['model', 'mirror'],
  description: 'Endpoint designed to be used by a webhook to trigger the importing of model content.',
  schema: postRequestImportFromS3Schema,
  responses: {
    200: {
      description: 'Information about the successfully imported content.',
      content: {
        'application/json': {
          schema: z.object({
            mirroredModelId: z.string(),
            sourceModelId: z.string(),
            modelCardVersions: z.array(z.number()),
          }),
        },
      },
    },
  },
})

interface PostRequestImportResponse {
  mirroredModelId: string
  sourceModelId: string
  modelCardVersions: number[]
}

export const postRequestImportFromS3 = [
  bodyParser.json(),
  async (req: Request, res: Response<PostRequestImportResponse>) => {
    req.audit = AuditInfo.CreateImport
    const {
      body: { payloadUrl, mirroredModelId },
    } = parse(req, postRequestImportFromS3Schema)

    const importInfo = await importModel(req.user, mirroredModelId, payloadUrl)
    await audit.onCreateImport(req, importInfo.mirroredModelId, importInfo.sourceModelId, importInfo.modelCardVersions)

    return res.json(importInfo)
  },
]
