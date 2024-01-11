import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ReleaseInterface } from '../../../models/v2/Release.js'
import { updateRelease } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const putReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    notes: z.string(),
    draft: z.coerce.boolean().optional().default(false),

    fileIds: z.array(z.string()),
    images: z.array(
      z.object({
        repository: z.string(),
        name: z.string(),
        tag: z.string(),
      }),
    ),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/model/{modelId}/release/{semver}',
  tags: ['release'],
  description: 'Update a model release.',
  schema: putReleaseSchema,
  responses: {
    200: {
      description: 'A release instance.',
      content: {
        'application/json': {
          schema: z.object({
            card: releaseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PutReleaseResponse {
  release: ReleaseInterface
}

export const putRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<PutReleaseResponse>) => {
    req.audit = AuditInfo.UpdateRelease
    const {
      params: { modelId, semver },
      body,
    } = parse(req, putReleaseSchema)

    const release = await updateRelease(req.user, modelId, semver, body)
    await audit.onUpdateRelease(req, release)

    return res.json({
      release,
    })
  },
]
