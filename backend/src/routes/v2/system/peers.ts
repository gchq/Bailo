import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import peers from '../../../connectors/peer/index.js'
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
  bodyParser.json(),
  async (req: Request, res: Response<GetPeerStatusResponse>) => {
    const _ = parse(req, getPeerStatusSchema)
    const peersWrapper = await peers()

    return res.json({
      peers: Object.fromEntries(await peersWrapper.status()),
    })
  },
]
