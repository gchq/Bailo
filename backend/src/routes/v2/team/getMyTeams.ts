import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { TeamInterface } from '../../../models/Team.js'
import { parse } from '../../../utils/v2/validate.js'

export const getMyTeamsSchema = z.object({})

interface GetMyTeamsResponse {
  teams: Array<TeamInterface>
}

export const patchTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<GetMyTeamsResponse>) => {
    const _ = parse(req, getMyTeamsSchema)

    return res.json({
      teams: [
        {
          id: 'example-team',

          name: 'Example Team',
          description: 'An example Bailo team',

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
  },
]
