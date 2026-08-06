import { Router } from 'express'

import { getDockerRegistryAuth } from './registryAuth.js'

const router = Router()

router.get('/registry_auth', ...getDockerRegistryAuth)

export default router
