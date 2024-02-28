import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { TeamInterface } from '../../../models/Team.js'
import { parse } from '../../../utils/validate.js'

export const getTeamSchema = z.object({
  params: z.object({
    teamId: z.string({
      required_error: 'Must specify team id as URL parameter',
    }),
  }),
})

interface GetTeamResponse {
  team: TeamInterface
}

export const getTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<GetTeamResponse>) => {
    const _ = parse(req, getTeamSchema)

    return res.json({
      team: {
        id: 'example-team',

        name: 'Example Team',
        description: 'An example Bailo team',

        deleted: false,

        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },
]
