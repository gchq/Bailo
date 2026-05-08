import { Router } from 'express'

import { generateV3SwaggerSpec } from '../../services/specification.js'
import { getImageByDigest } from '../v2/model/images/getImage.js'

const router = Router()

router.get('/api-docs/swagger.json', (req, res) => res.json(generateV3SwaggerSpec()))

router.get('/model/:modelId/image/:name/:tag/:digest', ...getImageByDigest)

export default router
