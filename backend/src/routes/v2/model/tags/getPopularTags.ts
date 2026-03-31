import { Request, Response } from 'express'

import { z } from '../../../../lib/zod.js'
import { popularTagsForEntries } from '../../../../services/model.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getPopularTagsSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/models/tags',
  tags: ['tags'],
  description: 'Get a list of the most commonly used tags',
  schema: getPopularTagsSchema,
  responses: {
    200: {
      description: 'A list of commonly used tags in string format',
      content: {
        'application/json': {
          schema: z.object({ tags: z.array(z.string()) }),
        },
      },
    },
  },
})

interface GetPopularTagsResponse {
  tags: string[]
}

export const getPopularTags = [
  async (req: Request, res: Response<GetPopularTagsResponse>): Promise<void> => {
    const _ = parse(req, getPopularTagsSchema)
    const tags = await popularTagsForEntries()
    res.json({ tags })
  },
]
