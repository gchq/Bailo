import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { UserInformation } from '../../../connectors/authentication/Base.js'
import authentication from '../../../connectors/authentication/index.js'
import { registerPath, UserInformationSchemaList } from '../../../services/specification.js'
import { toEntity } from '../../../utils/entity.js'
import { coerceArray, parse } from '../../../utils/validate.js'

export const getEntitiesLookupSchema = z.object({
  query: z.object({
    dnList: coerceArray(z.array(z.string())),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/entities/lookup',
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
      query: { dnList },
    } = parse(req, getEntitiesLookupSchema)
    const dnListArray = dnList.map((dnListMember) => toEntity('user', dnListMember))
    const informationList = await authentication.getMultipleUsersInformation(dnListArray)

    return res.json({ entities: informationList })
  },
]
