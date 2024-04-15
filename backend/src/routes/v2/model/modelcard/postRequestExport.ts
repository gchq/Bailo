import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { exportModel } from '../../../../services/mirroredModel.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postRequestExportSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    releases: z.array(z.string()).optional(),
    disclaimerAgreement: z.boolean(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/:modelId/export',
  tags: ['model', 'mirror'],
  description:
    'Request for all current model card revisions to be exported to S3 as a Zip file. Can also include releases specified by semver in the body.',
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
      body: { disclaimerAgreement, releases },
    } = parse(req, postRequestExportSchema)

    await exportModel(req.user, modelId, disclaimerAgreement, releases)

    return res.json({
      message: 'Successfully exported model cards',
    })
  },
]
