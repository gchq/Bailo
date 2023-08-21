import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { FileCategory, FileInterface } from '../../../../models/v2/File.js'
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
    const _ = parse(req, getFilesSchema)

    return res.json({
      files: [
        {
          modelId: 'example-model',

          name: 'example-file',
          category: FileCategory.Other,
          size: 1024,

          bucket: 'uploads',
          path: '/example/upload/path',

          complete: true,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
  },
]
