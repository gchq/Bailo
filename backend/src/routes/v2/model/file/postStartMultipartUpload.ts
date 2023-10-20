import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../utils/validate.js'

export const postStartMultipartUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),

    size: z.number(),
  }),
})

interface PresignedChunk {
  presignedUrl: string
  startByte: number
  endByte: number
}

interface PostStartMultipartUpload {
  fileId: string
  chunks: Array<PresignedChunk>
}

export const postStartMultipartUpload = [
  async (req: Request, res: Response<PostStartMultipartUpload>) => {
    const _ = parse(req, postStartMultipartUploadSchema)

    return res.json({
      fileId: 'random_hash',
      chunks: [
        {
          presignedUrl: 'https://example.com/',
          startByte: 0,
          endByte: 49392,
        },
      ],
    })
  },
]
