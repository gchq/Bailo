import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { SchemaInterface, SchemaKind } from '../../../models/v2/Schema.js'
import { findSchemasByUse } from '../../../services/v2/schema.js'
import { parse } from '../../../utils/v2/validate.js'

export const getSchemasSchema = z.object({
  query: z.object({
    kind: z.nativeEnum(SchemaKind).optional(),
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
    const schemas: Array<SchemaInterface> = await findSchemasByUse(SchemaKind.Deployment)

    parse(req, getSchemasSchema)

    return res.json({
      data: {
        schemas,
      },
    })
  },
]
