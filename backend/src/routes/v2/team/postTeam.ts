import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { TeamInterface } from '../../../models/v2/Team.js'


interface PostTeamResponse {
  data: {
    team: TeamInterface
  }
}

export const postTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<PostTeamResponse>) => {

    return res.json({
      data: {
        team: {
          id: 'example-team',

          name: 'Example Team',
          description: 'An example Bailo team',

          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
  },
]