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
  async (req: Request, res: Response<PostFinishMultipartUpload>): Promise<void> => {
    const _ = parse(req, postFinishMultipartUploadSchema)

    res.json({
      message: 'Successfully finished multipart upload.',
    })
  },
]
