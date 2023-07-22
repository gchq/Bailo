import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { TeamInterface } from '../../../models/v2/Team.js'

export const getMyTeamsSchema = z.object({})

interface PatchTeamResponse {
  data: {
    team: TeamInterface
  }
}

export const patchTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchTeamResponse>) => {
    const _ = parse(req, getMyTeamsSchema)

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
