import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { getReleaseBySemver } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/validate.js'

export const getReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/release/{semver}',
  tags: ['release'],
  description: 'Get a specific release for a model.',
  schema: getReleaseSchema,
  responses: {
    200: {
      description: 'A release instance.',
      content: {
        'application/json': {
          schema: z.object({
            release: releaseInterfaceSchema,
          }),
        },
      },
    },
  },
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
