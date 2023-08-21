import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../utils/validate.js'

export const deleteReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

interface DeleteReleaseResponse {
  message: string
}

export const deleteRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteReleaseResponse>) => {
    const _ = parse(req, deleteReleaseSchema)

    return res.json({
      message: 'Successfully removed release.',
    })
  },
]
