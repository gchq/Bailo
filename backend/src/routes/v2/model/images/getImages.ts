import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { listModelImages } from '../../../../services/v2/registry.js'
import { parse } from '../../../../utils/validate.js'

export const getImagesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
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
