import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReleaseInterface } from '../../../models/Release.js'
import { updateReleaseComment } from '../../../services/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchReleaseCommentSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
    commentId: z.string(),
  }),
  body: z.object({
    comment: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/release/{semver}/comment/{commentId}',
  tags: ['release'],
  description: 'Update a comment to a model release.',
  schema: patchReleaseCommentSchema,
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

export const patchReleaseComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseCommentResponse>) => {
    req.audit = AuditInfo.UpdateRelease
    const {
      params: { modelId, semver, commentId },
      body,
    } = parse(req, patchReleaseCommentSchema)

    const release = await updateReleaseComment(req.user, modelId, semver, commentId, body.comment)

    await audit.onUpdateRelease(req, release)

    return res.json({
      release,
    })
  },
]
