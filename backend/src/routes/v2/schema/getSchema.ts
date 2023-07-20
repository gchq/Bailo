import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { SchemaInterface } from '../../../models/v2/Schema.js'

interface GetSchemaResponse {
  data: {
    schema: SchemaInterface
  }
}

export const getSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
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
