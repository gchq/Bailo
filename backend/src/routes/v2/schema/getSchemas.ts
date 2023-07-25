import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { SchemaInterface, SchemaKind } from '../../../models/v2/Schema.js'

export const getSchemasSchema = z.object({
  params: z.object({
    use: z.nativeEnum(SchemaKind),
  }),
})

interface GetSchemaResponse {
  data: {
    schemas: Array<SchemaInterface>
  }
}

export const getSchemas = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
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

            createdAt: new Date(),
            updatedAt: new Date(),
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

            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    })
  },
]
