import { ensureUserRole } from '../../utils/user'
import config from 'config'
import { Request, Response } from 'express'

export const getUiConfig = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const uiConfig = await config.get('uiConfig')

    if (!uiConfig) {
      req.log.error(`No UI config found`)
      return res.status(404).json({
        message: `Unable to find UI config'`,
      })
    }

    return res.json(uiConfig)
  },
]
