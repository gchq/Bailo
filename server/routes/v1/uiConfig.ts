import { ensureUserRole } from '../../utils/user'
import config from 'config'
import { Request, Response } from 'express'
import { NotFound } from '../../utils/result'

export const getUiConfig = [
  ensureUserRole('user'),
  async (_req: Request, res: Response) => {
    const uiConfig = await config.get('uiConfig')

    if (!uiConfig) {
      throw NotFound({}, `Unable to find UI Config`)
    }

    return res.json(uiConfig)
  },
]
