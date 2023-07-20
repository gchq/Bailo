import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { TeamInterface } from '../../../models/v2/Team.js'

interface PatchTeamResponse {
  data: {
    team: TeamInterface
  }
}

export const patchTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchTeamResponse>) => {
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
