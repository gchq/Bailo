import { Request, Response } from 'express'

import config from '../../utils/config.js'
import { NotFound } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'

export const getUiConfig = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const uiConfig = config.ui

    if (!uiConfig) {
      throw NotFound({ code: 'ui_config_not_found' }, `Unable to find UI Config`)
    }
    req.log.info({ code: 'fetching_ui_config', uiConfig }, 'User fetching UI config')
    return res.json(uiConfig)
  },
]
