import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { UserSettingsInterface } from '../../../models/UserSettings.js'
import { registerPath, userSettingsSchema } from '../../../services/specification.js'
import { updateUserSettings } from '../../../services/user.js'
import { parse } from '../../../utils/validate.js'

export const patchUserSettingsSchema = z.object({
  body: z.object({
    theme: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/user/settings',
  tags: ['settings'],
  description: 'Update user settings.',
  schema: patchUserSettingsSchema,
  responses: {
    200: {
      description: 'The updated user settings.',
      content: {
        'application/json': {
          schema: z.object({
            settings: userSettingsSchema,
          }),
        },
      },
    },
  },
})

interface PatchUserSettingsResponse {
  settings: UserSettingsInterface
}

export const patchUserSettings = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchUserSettingsResponse>) => {
    req.audit = AuditInfo.UpdateRelease
    const { body } = parse(req, patchUserSettingsSchema)

    const settings = await updateUserSettings(req.user, body)
    await audit.onUpdateUserSettings(req, settings)

    return res.json({
      settings,
    })
  },
]
