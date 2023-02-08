import config from 'config'
import { Request, Response } from 'express'
import { NotFound } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'

export const getUiConfig = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const uiConfig = config.get('uiConfig')

    if (!uiConfig) {
      throw NotFound({ code: 'ui_config_not_found' }, `Unable to find UI Config`)
    }

    req.log.info({ code: 'fetching_ui_config', uiConfig }, 'User fetching UI config')
    return res.json(uiConfig)
  },
]
