import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../middleware/validate.js'

export const deleteFileSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

interface DeleteFileResponse {
  data: {
    message: string
  }
}

export const deleteFile = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteFileResponse>) => {
    const _ = parse(req, deleteFileSchema)

    return res.json({
      data: {
        message: 'Successfully removed file.',
      },
    })
  },
]
