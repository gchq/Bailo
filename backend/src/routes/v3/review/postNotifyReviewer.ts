import { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { notifyReviewer } from '../../../services/v3/review.js'
import { parse } from '../../../utils/validate.js'

const reviewNotifierLimiter = rateLimit({
  windowMs: 30000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Create a unique key based on the user and review ID so users can request different releases/access requests
    const userDn = req.user?.dn ?? req.ip
    return `${userDn}-${req.params['reviewId']}`
  },
})

export const postNotifyReviewerSchema = z.object({
  params: z.object({
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/review/{reviewId}/notify',
    tags: ['review'],
    description: 'Notify all reviewers of this review role that this item needs another review',
    schema: postNotifyReviewerSchema,
    responses: {
      200: {
        description: 'The status of the request.',
      },
    },
  },
  'v3',
)

export const postNotifyReviewer = [
  reviewNotifierLimiter,
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.NotifyReviewers
    const {
      params: { reviewId },
    } = parse(req, postNotifyReviewerSchema)
    await notifyReviewer(req.user, reviewId)
    await audit.onNotifyReviewers(req, reviewId)
    res.sendStatus(200)
  },
]
