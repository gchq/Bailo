import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { ReleaseInterface } from '../../../models/v2/Release.js'

interface PostReleaseResponse {
  data: {
    release: ReleaseInterface
  }
}

export const postRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseResponse>) => {
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
