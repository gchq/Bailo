import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../utils/validate.js'
import { ReleaseInterface } from '../../../models/v2/Release.js'

export const getReleasesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

interface getReleasesResponse {
  data: {
    releases: Array<ReleaseInterface>
  }
}

export const getReleases = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleasesResponse>) => {
    const _ = parse(req, getReleasesSchema)

    return res.json({
      data: {
        releases: [
          {
            modelId: 'example-model-1',
            modelCardVersion: 14,

            name: 'Example Release 1',
            semver: '123',
            notes: 'This is an example release',

            minor: true,
            draft: true,

            files: ['example-file-id'],
            images: ['example-image-id'],

            deleted: false,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            modelId: 'example-model-1',
            modelCardVersion: 15,

            name: 'Example Release 2',
            semver: '123',
            notes: 'This is an example release',

            minor: true,
            draft: true,

            files: ['example-file-id'],
            images: ['example-image-id'],

            deleted: false,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    })
  },
]
