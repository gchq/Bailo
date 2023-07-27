import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { SchemaInterface, SchemaKind } from '../../../models/v2/Schema.js'
import { parse } from '../../../utils/v2/validate.js'

export const getSchemasSchema = z.object({
  query: z.object({
    kind: z.nativeEnum(SchemaKind).optional(),
  })
})

interface GetSchemaResponse {
  data: {
    schemas: Array<SchemaInterface>
  }
}

export const getSchemas = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
    parse(req, getSchemasSchema)
    return res.json({
      data: {
        schemas: [
          {
            id: 'example-schema-1',
            name: 'Example Schema 1',

            inactive: false,
            hidden: false,
            kind: 'deployment',
            display: 'This is the display?',
            fields: {
              'field 1': 'field 1 info',
            },
            metadata: { example: true },

            createdAt: new Date('2023-07-25T14:26:45.121Z'),
            updatedAt: new Date('2023-07-25T14:26:45.121Z'),
          },
          {
            id: 'example-schema-2',
            name: 'Example Schema 2',

            inactive: false,
            hidden: false,
            kind: 'model',
            display: 'This is the display?',
            fields: {
              'field 1': 'field 1 info',
            },
            metadata: { example: true },

            createdAt: new Date('2023-07-25T14:26:45.121Z'),
            updatedAt: new Date('2023-07-25T14:26:45.121Z'),
          },
        ],
      },
    })
  },
]
