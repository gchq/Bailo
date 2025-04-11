import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { registerPath, systemStatusSchema } from '../../../services/specification.js'
import { SystemStatus } from '../../../types/types.js'
import config from '../../../utils/config.js'
import { parse } from '../../../utils/validate.js'

export const getSystemStatusSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/system/status',
  tags: ['system'],
  description: 'Get the system status',
  schema: getSystemStatusSchema,
  responses: {
    200: {
      description: 'Details about the system status',
      content: {
        'application/json': {
          schema: z.object({ status: systemStatusSchema }),
        },
      },
    },
  },
})

export const getSystemStatus = [
  bodyParser.json(),
  async (req: Request, res: Response<SystemStatus>) => {
    const _ = parse(req, getSystemStatusSchema)

    const federation = {
      state: config.federation.state,
      id: config.federation.id,
    }

    return res.json({
      code: 200,
      ping: 'pong',
      federation,
    })
  },
]
