import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { UserSettingsInterface } from '../../../models/UserSettings.js'
import { registerPath, userSettingsSchema } from '../../../services/specification.js'
import { findUserSettings } from '../../../services/user.js'
import { parse } from '../../../utils/validate.js'

export const getUserSettingsSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/user/settings',
  tags: ['settings'],
  description: 'Get the settings for current user.',
  schema: getUserSettingsSchema,
  responses: {
    200: {
      description: 'A collection of user settings',
      content: {
        'application/json': {
          schema: z.object({
            tokens: z.array(userSettingsSchema),
          }),
        },
      },
    },
  },
})

interface GetUserSettingsResponse {
  settings: UserSettingsInterface
}

export const getUserSettings = [
  bodyParser.json(),
  async (req: Request, res: Response<GetUserSettingsResponse>) => {
    req.audit = AuditInfo.ViewUserSettings
    const _ = parse(req, getUserSettingsSchema)

    const settings = await findUserSettings(req.user)
    await audit.onViewUserSettings(req, settings)

    return res.json({
      settings,
    })
  },
]
