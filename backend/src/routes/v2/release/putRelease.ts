import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReleaseInterface } from '../../../models/Release.js'
import { updateRelease } from '../../../services/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const putReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    notes: z.string().min(1, 'Please provide release notes.'),
    draft: z.coerce.boolean().optional().default(false),
    modelCardVersion: z.number().openapi({ example: 1 }),

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
  async (req: Request, res: Response<PutReleaseResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateRelease
    const {
      params: { modelId, semver },
      body,
    } = parse(req, putReleaseSchema)

    const release = await updateRelease(req.user, modelId, semver, body)
    await audit.onUpdateRelease(req, release)

    res.json({
      release,
    })
  },
]
