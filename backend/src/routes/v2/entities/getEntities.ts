import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import authentication from '../../../connectors/v2/authentication/index.js'
import { parse } from '../../../utils/v2/validate.js'

export const getEntitiesSchema = z.object({
  query: z.object({
    q: z.string(),
  }),
})

interface GetEntitiesResponse {
  results: Array<{ kind: string; id: string }>
}

export const getEntities = [
  bodyParser.json(),
  async (req: Request, res: Response<GetEntitiesResponse>) => {
    const {
      query: { q },
    } = parse(req, getEntitiesSchema)

    if (q.length < 3) {
      return { results: [] }
    }
    const queryResults = await authentication.queryEntities(q)

    return res.json({ results: queryResults })
  },
]
