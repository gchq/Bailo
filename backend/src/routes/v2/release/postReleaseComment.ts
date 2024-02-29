import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ReleaseInterface } from '../../../models/v2/Release.js'
import { newReleaseComment } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const postReleaseCommentSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    comment: z.string(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/release/{semver}/comment',
  tags: ['release'],
  description: 'Add a comment to a model release.',
  schema: postReleaseCommentSchema,
  responses: {
    200: {
      description: 'A release comment instance.',
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

interface PostReleaseCommentResponse {
  release: ReleaseInterface
}

export const postReleaseComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseCommentResponse>) => {
    req.audit = AuditInfo.UpdateRelease
    const {
      params: { modelId, semver },
      body,
    } = parse(req, postReleaseCommentSchema)

    const release = await newReleaseComment(req.user, modelId, semver, body.comment)

    await audit.onUpdateRelease(req, release)

    return res.json({
      release,
    })
  },
]
