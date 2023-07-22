import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { FileCategory, FileInterface } from '../../../models/v2/File.js'

export const getModelFilesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetModelFilesResponse {
  data: {
    files: Array<FileInterface>
  }
}

export const getModelFiles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelFilesResponse>) => {
    const _ = parse(req, getModelFilesSchema)

    return res.json({
      data: {
        files: [
          {
            modelId: 'example-model',

            name: 'example-file',
            category: FileCategory.Other,
            size: 1024,

            bucket: 'uploads',
            path: '/example/upload/path',

            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    })
  },
]
