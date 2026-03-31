import { Request, Response } from 'express'

import authentication from '../../../connectors/authentication/index.js'
import { z } from '../../../lib/zod.js'
import { parse } from '../../../utils/validate.js'

export const getEntitiesSchema = z.object({
  query: z.object({
    q: z.string(),
  }),
})

interface GetEntitiesResponse {
  results: Array<{ kind: string; id: string }>
}

export const getEntities = [
  async (req: Request, res: Response<GetEntitiesResponse>): Promise<void> => {
    const {
      query: { q },
    } = parse(req, getEntitiesSchema)

    if (q.length < 3) {
      res.json({ results: [] })
    }
    const queryResults = await authentication.queryEntities(q)

    res.json({ results: queryResults })
  },
]
