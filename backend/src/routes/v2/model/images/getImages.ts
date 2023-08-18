import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ImageInterface } from '../../../../models/v2/Image.js'
import { parse } from '../../../../utils/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetImagesResponse {
  data: {
    images: Array<ImageInterface>
  }
}

export const getImages = [
  bodyParser.json(),
  async (req: Request, res: Response<GetImagesResponse>) => {
    const _ = parse(req, getImagesSchema)

    return res.json({
      data: {
        images: [
          {
            modelId: 'model-123',

            namespace: 'abc',
            model: 'model',
            version: '1.2.3',

            size: 4834382,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    })
  },
]
