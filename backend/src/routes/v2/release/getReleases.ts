import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { getModelReleases } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/validate.js'

export const getReleasesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/releases',
  tags: ['release'],
  description: 'Get all releases for a model.',
  schema: getReleasesSchema,
  responses: {
    200: {
      description: 'An array of release instances.',
      content: {
        'application/json': {
          schema: z.object({
            releases: z.array(releaseInterfaceSchema),
          }),
        },
      },
    },
  },
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
