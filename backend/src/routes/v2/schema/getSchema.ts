import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../utils/validate.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { findSchemaById } from '../../../services/v2/schema.js'

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
    const { params } = parse(req, getSchemaSchema)

    const schema = await findSchemaById(params.schemaId)

    return res.json({
      data: {
        schema,
      },
    })
  },
]
