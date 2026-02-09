import { Request, Response } from 'express'

import peers from '../../../connectors/peer/index.js'
import { z } from '../../../lib/zod.js'
import { peersConfigStatusSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getPeerStatusSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/system/peers',
  tags: ['system'],
  description: 'Get the peer connectivity status',
  schema: getPeerStatusSchema,
  responses: {
    200: {
      description: 'Details about the peers of this system',
      content: {
        'application/json': {
          schema: peersConfigStatusSchema,
        },
      },
    },
  },
})

interface GetPeerStatusResponse {
  peers: any
}

export const getPeerStatus = [
  async (req: Request, res: Response<GetPeerStatusResponse>): Promise<void> => {
    const _ = parse(req, getPeerStatusSchema)

    res.json({
      peers: Object.fromEntries(await peers.status()),
    })
  },
]
