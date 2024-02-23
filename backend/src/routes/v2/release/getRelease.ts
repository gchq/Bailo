import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { FileInterface } from '../../../models/File.js'
import { ReleaseInterface } from '../../../models/Release.js'
import { getFilesByIds } from '../../../services/file.js'
import { getReleaseBySemver } from '../../../services/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/specification.js'
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
  release: ReleaseInterface & { files: FileInterface[] }
}

export const getRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleaseResponse>) => {
    req.audit = AuditInfo.ViewRelease
    const {
      params: { modelId, semver },
    } = parse(req, getReleaseSchema)

    const release = await getReleaseBySemver(req.user, modelId, semver)
    await audit.onViewRelease(req, release)
    const files = await getFilesByIds(req.user, modelId, release.fileIds)
    const releaseWithFiles = { ...release.toObject(), files }

    return res.json({
      release: releaseWithFiles,
    })
  },
]
