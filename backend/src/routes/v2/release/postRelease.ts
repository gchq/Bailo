import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReleaseInterface } from '../../../models/Release.js'
import { createRelease } from '../../../services/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postReleaseSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
  body: z.object({
    modelCardVersion: z.coerce.number().optional().openapi({ example: 1 }),

    semver: z.string(),
    notes: z.string().min(1, 'Please provide release notes.'),

    minor: z.coerce.boolean().optional().default(false),
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
  method: 'post',
  path: '/api/v2/model/{modelId}/releases',
  tags: ['release'],
  description: 'Create a new release for a model.',
  schema: postReleaseSchema,
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

interface PostReleaseResponse {
  release: ReleaseInterface
}

export const postRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseResponse>) => {
    req.audit = AuditInfo.CreateRelease
    const {
      params: { modelId },
      body,
    } = parse(req, postReleaseSchema)

    const release = await createRelease(req.user, { modelId, ...body })

    await audit.onCreateRelease(req, release)

    return res.json({
      release,
    })
  },
]
