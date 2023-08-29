import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../utils/validate.js'

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
  message: string
}

export const postFinishMultipartUpload = [
  async (req: Request, res: Response<PostFinishMultipartUpload>) => {
    const _ = parse(req, postFinishMultipartUploadSchema)

    return res.json({
      message: 'Successfully finished multipart upload.',
    })
  },
]
