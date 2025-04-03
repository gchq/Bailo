import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { FileWithScanResultsInterface } from '../../../models/File.js'
import { ModelInterface } from '../../../models/Model.js'
import { ReleaseInterface } from '../../../models/Release.js'
import { getModelReleases } from '../../../services/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getReleasesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
  query: z.object({
    querySemver: z.string().optional().openapi({ example: '>2.2.2' }).openapi({
      description: 'Query for semver ranges, as described in https://docs.npmjs.com/cli/v6/using-npm/semver#ranges',
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
  releases: Array<ReleaseInterface & { model: ModelInterface; files: FileWithScanResultsInterface[] }>
}

export const getReleases = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleasesResponse>) => {
    req.audit = AuditInfo.ViewReleases
    const {
      params: { modelId },
      query: { querySemver },
    } = parse(req, getReleasesSchema)

    const releases = await getModelReleases(req.user, modelId, querySemver)
    await audit.onViewReleases(req, releases)

    return res.json({
      releases,
    })
  },
]
