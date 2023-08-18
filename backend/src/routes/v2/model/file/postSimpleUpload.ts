import { Request, Response } from 'express'
import { z } from 'zod'

import { FileCategory } from '../../../../models/v2/File.js'
import { parse } from '../../../../utils/validate.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
    category: z.nativeEnum(FileCategory).optional().default(FileCategory.Other),
  }),
})

interface PostSimpleUpload {
  fileId: string
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>) => {
    const _ = parse(req, postSimpleUploadSchema)

    return res.json({
      fileId: '5effaa5662679b5af2c58829',
    })
  },
]
