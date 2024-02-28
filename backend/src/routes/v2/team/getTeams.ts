import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { TeamInterface } from '../../../models/Team.js'
import { parse } from '../../../utils/validate.js'

export const getTeamsSchema = z.object({})

interface GetTeamsResponse {
  teams: Array<TeamInterface>
}

export const getTeams = [
  bodyParser.json(),
  async (req: Request, res: Response<GetTeamsResponse>) => {
    const _ = parse(req, getTeamsSchema)

    return res.json({
      teams: [
        {
          id: 'uncategorised',

          name: 'Uncategorised',
          description: 'Default team category',

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'example-team',

          name: 'Example Team',
          description: 'An example Bailo team',

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'example-team-2',

          name: 'Example Team 2',
          description: 'An example Bailo team 2',

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
  },
]
