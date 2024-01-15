import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { UserInformation } from '../../../connectors/v2/authentication/Base.js'
import authentication from '../../../connectors/v2/authentication/index.js'
import { registerPath, UserInformationSchema } from '../../../services/v2/specification.js'
import { toEntity } from '../../../utils/v2/entity.js'
import { parse } from '../../../utils/v2/validate.js'

export const getEntityLookupSchema = z.object({
  params: z.object({
    dn: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/entity/{dn}/lookup',
  tags: ['user'],
  description: 'Get information about an entity',
  schema: getEntityLookupSchema,
  responses: {
    200: {
      description: 'Information about the provided entity.',
      content: {
        'application/json': {
          schema: z.object({ entity: UserInformationSchema }),
        },
      },
    },
  },
})

interface GetEntityLookup {
  entity: UserInformation
}

export const getEntityLookup = [
  bodyParser.json(),
  async (req: Request, res: Response<GetEntityLookup>) => {
    const {
      params: { dn },
    } = parse(req, getEntityLookupSchema)

    const information = await authentication.getUserInformation(toEntity('user', dn))

    return res.json({ entity: information })
  },
]
