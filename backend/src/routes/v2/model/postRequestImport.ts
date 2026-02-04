import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { importModel } from '../../../services/mirroredModel/mirroredModel.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postRequestImportFromS3Schema = z.object({
  body: z.object({
    payloadUrl: z.string(),
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
}

export const postRequestImportFromS3 = [
  async (req: Request, res: Response<PostRequestImportResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateImport
    const {
      body: { payloadUrl },
    } = parse(req, postRequestImportFromS3Schema)

    const { mirroredModel, importResult } = await importModel(req.user, payloadUrl)
    await audit.onCreateImport(
      req,
      mirroredModel,
      importResult.metadata.sourceModelId,
      importResult.metadata.exporter,
      // drop `metadata` from `importResult`
      (({ metadata: _, ...o }) => o)(importResult),
    )

    res.json({
      mirroredModelId: mirroredModel.id,
      sourceModelId: importResult.metadata.sourceModelId,
    })
  },
]
