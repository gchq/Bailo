import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../middleware/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetImagesResponse {
  data: {
    images: Array<Image>
  }
}

export const getImages = [
  bodyParser.json(),
  async (req: Request, res: Response<GetImagesResponse>) => {
    const _ = parse(req, getImagesSchema)

    return res.json({
      data: {
        images: [],
      },
    })
  },
]
