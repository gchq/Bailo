import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { listModelImages } from '../../../../services/v2/registry.js'
import { registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/images',
  tags: ['image'],
  description: 'Get all of the images associated with a model.',
  schema: getImagesSchema,
  responses: {
    200: {
      description: 'An array of images associated with the model.',
      content: {
        'application/json': {
          schema: z.object({
            images: z.array(
              z.object({
                namespace: z.string().openapi({ example: 'yolo-v4-abcdef' }),
                model: z.string().openapi({ example: 'yolo' }),
                versions: z.array(z.string()).openapi({ example: ['v1-cpu', 'v2-gpu'] }),
              }),
            ),
          }),
        },
      },
    },
  },
})

interface GetImagesResponse {
  images: Array<{
    repository: string
    name: string
    tags: Array<string>
  }>
}

export const getImages = [
  bodyParser.json(),
  async (req: Request, res: Response<GetImagesResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getImagesSchema)

    return res.json({
      images: await listModelImages(req.user, modelId),
    })
  },
]
