import { Request, Response } from 'express'
import { z } from 'zod'

import { registerPath } from '../../../services/specification.js'
import { UiConfig } from '../../../types/types.js'
import config from '../../../utils/config.js'
import { NotFound } from '../../../utils/result.js'
import { parse } from '../../../utils/validate.js'

export const getUiConfigSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/config/ui',
  tags: ['user'],
  description: 'Get the UI config',
  schema: getUiConfigSchema,
  responses: {
    200: {
      description:
        'Provides instance specific configuration settings for the UI, including external domains, banner information and more.',
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
    },
  },
})

interface GetUiConfigResponse {
  uiConfig: UiConfig
}

export const getUiConfig = [
  async (req: Request, res: Response<GetUiConfigResponse>) => {
    const _ = parse(req, getUiConfigSchema)
    const uiConfig = config.ui

    if (!uiConfig) {
      throw NotFound({ code: 'ui_config_not_found' }, `Unable to find UI config`)
    }

    return res.json({ uiConfig })
  },
]
