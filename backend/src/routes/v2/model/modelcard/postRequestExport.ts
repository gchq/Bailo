import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { exportModelCardRevisions } from '../../../../services/mirroredModel.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postRequestExportSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    disclaimerAgreement: z.boolean(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/model-card-revisions/export',
  tags: ['modelcard'],
  description: 'Request for all current model card reviews to be exported to S3 as a Zip file.',
  schema: postRequestExportSchema,
  responses: {
    200: {
      description: 'A success message.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully exported model cards' }),
          }),
        },
      },
    },
  },
})

interface PostRequestExportResponse {
  message: string
}

export const postRequestExport = [
  bodyParser.json(),
  async (req: Request, res: Response<PostRequestExportResponse>) => {
    const {
      params: { modelId },
      body: { disclaimerAgreement },
    } = parse(req, postRequestExportSchema)

    await exportModelCardRevisions(req.user, modelId, disclaimerAgreement)

    return res.json({
      message: 'Successfully exported model cards',
    })
  },
]
