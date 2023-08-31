import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { getReleaseBySemver } from '../../../services/v2/release.js'
import { parse } from '../../../utils/validate.js'

export const getReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

interface getReleaseResponse {
  release: ReleaseInterface
}

export const getRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleaseResponse>) => {
    const {
      params: { modelId, semver },
    } = parse(req, getReleaseSchema)

    const release = await getReleaseBySemver(req.user, modelId, semver)

    return res.json({
      release,
    })
  },
]
