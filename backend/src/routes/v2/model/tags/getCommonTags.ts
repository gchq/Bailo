import { Request, Response } from 'express'
import { z } from 'zod'

import { registerPath } from '../../../../services/specification.js'
import config from '../../../../utils/config.js'
import { NotFound } from '../../../../utils/result.js'
import { parse } from '../../../../utils/validate.js'
import { commonTagsForEntries } from '../../../../services/model.js'

export const getCommonTagsSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/model',
  tags: ['tags'],
  description: 'Get a list of the most commonly used tags',
  schema: getCommonTagsSchema,
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

interface GetCommonTagsResponse {
  tags: string[]
}

export const getCommonTags = [
  async (req: Request, res: Response<GetCommonTagsResponse>): Promise<void> => {
    const _ = parse(req, getCommonTagsSchema)
    const tags = await commonTagsForEntries()
    res.json({ tags })
  },
]
