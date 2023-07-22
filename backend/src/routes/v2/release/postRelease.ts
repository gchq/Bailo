import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { ReleaseInterface } from '../../../models/v2/Release.js'

export const postReleaseSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
  body: z.object({
    modelCardVersion: z.coerce.number(),

    name: z.string(),
    semver: z.string(),
    notes: z.string(),

    minor: z.coerce.boolean().optional().default(false),
    draft: z.coerce.boolean().optional().default(false),

    files: z.array(z.string()),
    images: z.array(z.string()),
  }),
})

interface PostReleaseResponse {
  data: {
    release: ReleaseInterface
  }
}

export const postRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseResponse>) => {
    const _ = parse(req, postReleaseSchema)

    return res.json({
      data: {
        release: {
          modelId: 'example-model-1',
          modelCardId: 'example-model-card',

          name: 'Example Release 1',
          semver: '123',
          notes: 'This is an example release',

          minor: true,
          draft: true,

          files: [
            {
              modelId: 'example-model-1',
              name: 'test.py',
              category: 'code',
              size: 100,
              bucket: 'bucket',
              path: 'code/url',
            },
          ],
          images: [
            {
              modelId: 'example-model-1',
              ref: 'reference',
              size: 100,
            },
          ],

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
  },
]
