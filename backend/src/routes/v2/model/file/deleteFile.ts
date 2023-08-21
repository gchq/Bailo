import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../../utils/validate.js'

export const deleteFileSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

interface DeleteFileResponse {
  message: string
}

export const deleteFile = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteFileResponse>) => {
    const _ = parse(req, deleteFileSchema)

    return res.json({
      message: 'Successfully removed file.',
    })
  },
]
