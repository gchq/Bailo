import { Router } from 'express'

import { generateV3SwaggerSpec } from '../../services/specification.js'
import { getImageByDigest } from '../v3/model/images/getImage.js'
import { getComplianceMetrics } from './metrics/getComplianceMetrics.js'
import { getEntryVolume } from './metrics/getEntryVolume.js'
import { getUsageMetrics } from './metrics/getUsageMetrics.js'
import { postReviewResponse } from './review/postReviewResponse.js'

const router = Router()

router.get('/api-docs/swagger.json', (req, res) => res.json(generateV3SwaggerSpec()))

router.get('/model/:modelId/image/:name/:tag/:digest', ...getImageByDigest)

router.get('/metrics/usage', ...getUsageMetrics)
router.get('/metrics/compliance', ...getComplianceMetrics)
router.get('/metrics/entryVolume', ...getEntryVolume)

router.post('/review/response/:reviewId', ...postReviewResponse)

export default router
