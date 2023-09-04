import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { deleteRelease as deleteReleaseService } from '../../../services/v2/release.js'
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
    const {
      params: { modelId, semver },
    } = parse(req, deleteReleaseSchema)

    await deleteReleaseService(req.user, modelId, semver)

    return res.json({
      message: 'Successfully removed release.',
    })
  },
]
