import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { FileCategory } from '../../../models/v2/File.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    category: z.nativeEnum(FileCategory).optional().default(FileCategory.Other),
  }),
})

interface PostSimpleUpload {
  data: {
    fileId: string
  }
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>) => {
    const _ = parse(req, postSimpleUploadSchema)

    return res.json({
      data: {
        fileId: '5effaa5662679b5af2c58829',
      },
    })
  },
]
