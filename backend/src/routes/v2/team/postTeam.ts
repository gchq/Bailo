import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { TeamInterface } from '../../../models/v2/Team.js'
import { parse } from '../../../utils/v2/validate.js'

export const postTeamSchema = z.object({
  body: z.object({
    id: z.string({
      required_error: 'Must specify team id',
    }),
    name: z.string({
      required_error: 'Must specify team name',
    }),
    description: z.string({
      required_error: 'Must specify team description',
    }),
  }),
})

interface PostTeamResponse {
  team: TeamInterface
}

export const postTeam = [
  bodyParser.json(),
  async (req: Request, res: Response<PostTeamResponse>) => {
    const _ = parse(req, postTeamSchema)

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
