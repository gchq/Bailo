import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { TeamInterface } from '../../../models/v2/Team.js'

interface GetTeamsResponse {
  data: {
    teams: Array<TeamInterface>
  }
}

export const getTeams = [
  bodyParser.json(),
  async (req: Request, res: Response<GetTeamsResponse>) => {
    return res.json({
      data: {
        teams: [
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
      },
    })
  },
]