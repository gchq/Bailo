import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { notifyReviewer } from '../../../services/v3/response.js'
import { parse } from '../../../utils/validate.js'

export const postNotifyReviewerSchema = z.object({
  params: z.object({
    responseId: z.string(),
  }),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/response/{responseId}/reviewer/notify',
    tags: ['response'],
    description: 'Notify the author of the review response that this item needs another review',
    schema: postNotifyReviewerSchema,
    responses: {
      200: {
        description: 'The status of the request.',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string(),
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface PostNotifyReviewerResponse {
  status: string
}

export const postNotifyReviewer = [
  async (req: Request, res: Response<PostNotifyReviewerResponse>): Promise<void> => {
    const {
      params: { responseId },
    } = parse(req, postNotifyReviewerSchema)

    await notifyReviewer(req.user, responseId)

    res.json({ status: 'Notification sent to reviewer.' })
  },
]
