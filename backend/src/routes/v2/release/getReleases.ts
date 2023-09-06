import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { getModelReleases } from '../../../services/v2/release.js'
import { parse } from '../../../utils/validate.js'

export const getReleasesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

interface getReleasesResponse {
  releases: Array<ReleaseInterface>
}

export const getReleases = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleasesResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getReleasesSchema)

    const releases = await getModelReleases(req.user, modelId)

    return res.json({
      releases,
    })
  },
]
