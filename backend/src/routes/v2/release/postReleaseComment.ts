import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ResponseInterface } from '../../../models/Response.js'
import { newReleaseComment } from '../../../services/release.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

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
            release: responseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostReleaseCommentResponse {
  response: ResponseInterface
}

export const postReleaseComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseCommentResponse>) => {
    req.audit = AuditInfo.UpdateRelease
    const {
      params: { modelId, semver },
      body,
    } = parse(req, postReleaseCommentSchema)

    const releaseComment = await newReleaseComment(req.user, modelId, semver, body.comment)

    await audit.onCreateCommentResponse(req, releaseComment)

    return res.json({
      response: releaseComment,
    })
  },
]
