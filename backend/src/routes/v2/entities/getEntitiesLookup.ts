import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { UserInformation } from '../../../connectors/authentication/Base.js'
import authentication from '../../../connectors/authentication/index.js'
import { registerPath, UserInformationSchemaList } from '../../../services/specification.js'
import { toEntity } from '../../../utils/entity.js'
import { parse } from '../../../utils/validate.js'

export const getEntitiesLookupSchema = z.object({
  params: z.object({
    dnList: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/entities/{dnList}/lookup',
  tags: ['user'],
  description: 'Get information about a list of entities',
  schema: getEntitiesLookupSchema,
  responses: {
    200: {
      description: 'Information about the provided entities.',
      content: {
        'application/json': {
          schema: z.object({ entities: UserInformationSchemaList }),
        },
      },
    },
  },
})

interface GetEntitiesLookup {
  entities: UserInformation[]
}

export const getEntitiesLookup = [
  bodyParser.json(),
  async (req: Request, res: Response<GetEntitiesLookup>) => {
    const {
      params: { dnList },
    } = parse(req, getEntitiesLookupSchema)

    const informationList = await authentication.getUserInformationList(toEntity('user', dnList)) //TODO WORK OUT HOW THIS WORKS? WHAT IS THIS ACTUALLY RETURNING?

    return res.json({ entities: informationList })
  },
]
