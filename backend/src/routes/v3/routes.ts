import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { generateV3SwaggerSpec } from '../../services/specification.js'
import { getImageByDigest } from '../v3/model/images/getImage.js'
import { getCurrentUser } from './entities/getCurrentUser.js'
import { getComplianceMetrics } from './metrics/getComplianceMetrics.js'
import { getEntryVolume } from './metrics/getEntryVolume.js'
import { getUsageMetrics } from './metrics/getUsageMetrics.js'
import { getLatestResponse } from './response/getLatestResponseForReview.js'
import { postNotifyReviewer } from './review/postNotifyReviewer.js'
import { postReview } from './review/postReview.js'
import { postReviewResponse } from './review/postReviewResponse.js'

const reviewNotifierLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req) => {
    // Create a unique key based on the user and review ID so users can request different releases/access requests
    return `${req.user.dn}-${req.params['reviewId']}`
  },
})

const router = Router()

router.get('/api-docs/swagger.json', (req, res) => res.json(generateV3SwaggerSpec()))

router.get('/model/:modelId/image/:name/:tag/:digest', ...getImageByDigest)

router.get('/metrics/usage', ...getUsageMetrics)
router.get('/metrics/compliance', ...getComplianceMetrics)
router.get('/metrics/entryVolume', ...getEntryVolume)

router.post('/review/:reviewId/response', ...postReviewResponse)
router.post('/review/:modelId', ...postReview)
router.get('/review/:reviewId/responses/latest', ...getLatestResponse)
router.post('/review/:reviewId/notify', reviewNotifierLimiter, ...postNotifyReviewer)

router.get('/entities/me', ...getCurrentUser)

export default router
