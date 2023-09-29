import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { FileInterface } from '../../../../models/v2/File.js'
import { getFilesByModel } from '../../../../services/v2/file.js'
import { parse } from '../../../../utils/validate.js'

export const getFilesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetFilesResponse {
  files: Array<FileInterface>
}

export const getFiles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetFilesResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getFilesSchema)

    const files = await getFilesByModel(req.user, modelId)

    return res.json({
      files,
    })
  },
]
