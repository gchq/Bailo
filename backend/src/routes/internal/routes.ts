import bodyParser from 'body-parser'
import { Router } from 'express'

import { httpLog } from '../../services/log.js'
import { expressErrorHandler } from '../middleware/expressErrorHandler.js'
import { handleRegistryEvents } from './registry/events.js'

const router = Router()
router.use(bodyParser.json())
router.use(httpLog)

router.post('/registry/events', ...handleRegistryEvents)

router.use(expressErrorHandler)

export default router
