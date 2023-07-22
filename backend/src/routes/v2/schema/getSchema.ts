import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'

export const getSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id as URL parameter',
    }),
  }),
})

interface GetSchemaResponse {
  data: {
    schema: SchemaInterface
  }
}

export const getSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
    const _ = parse(req, getSchemaSchema)

    return res.json({
      data: {
        schema: {
          id: 'example-schema-1',
          name: 'Example Schema 1',

          inactive: false,
          hidden: false,
          use: 'deployment',
          display: 'This is the display?',
          fields: {
            'field 1': 'field 1 info',
          },
          metadata: { example: true },

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
  },
]
