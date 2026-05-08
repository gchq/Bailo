import { Router } from 'express'

import { getImageByDigest } from '../v2/model/images/getImage.js'

const router = Router()

router.get('/model/:modelId/image/:name/:tag/:digest', ...getImageByDigest)

export default router
