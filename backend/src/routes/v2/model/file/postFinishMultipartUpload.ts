import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../middleware/validate.js'

export const postFinishMultipartUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    fileId: z.string(),
    parts: z.array(z.unknown()),
  }),
})

interface PostFinishMultipartUpload {
  data: {
    message: string
  }
}

export const postFinishMultipartUpload = [
  async (req: Request, res: Response<PostFinishMultipartUpload>) => {
    const _ = parse(req, postFinishMultipartUploadSchema)

    return res.json({
      data: {
        message: 'Successfully finished multipart upload.',
      },
    })
  },
]
