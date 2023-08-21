import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { parse } from '../../../utils/validate.js'

export const getReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

interface getReleaseResponse {
  release: ReleaseInterface
}

export const getRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleaseResponse>) => {
    const _ = parse(req, getReleaseSchema)

    return res.json({
      release: {
        modelId: 'example-model-1',
        modelCardVersion: 14,

        name: 'Example Release 1',
        semver: '1.2.3',
        notes: 'This is an example release',

        minor: true,
        draft: true,

        files: ['example-file-id'],
        images: ['example-image-id'],

        deleted: false,

        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },
]
