import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { UserDoc } from '../../../models/v2/User.js'
import { parse } from '../../../utils/validate.js'

export const getCurrentUserSchema = z.object({})

interface GetCurrentUserResponses {
  user: UserDoc
}

export const getCurrentUser = [
  bodyParser.json(),
  async (req: Request, res: Response<GetCurrentUserResponses>) => {
    const _ = parse(req, getCurrentUserSchema)

    return res.json({ user: req.user })
  },
]
