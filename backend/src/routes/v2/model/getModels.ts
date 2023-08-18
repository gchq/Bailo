import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface } from '../../../models/v2/Model.js'
import { ModelCardInterface } from '../../../models/v2/ModelCard.js'
import { searchModels } from '../../../services/v2/modelCard.js'
import { GetModelFilters } from '../../../types/v2/enums.js'
import { coerceArray, parse } from '../../../utils/v2/validate.js'

export const getModelsSchema = z.object({
  query: z.object({
    // These are all optional with defaults.  If they are not provided, they do not filter settings.
    task: z.string().optional(),

    libraries: coerceArray(z.array(z.string()).optional().default([])),
    filters: coerceArray(z.array(z.nativeEnum(GetModelFilters)).optional().default([])),
    search: z.string().optional().default(''),
  }),
})

interface GetModelsResponse {
  data: {
    cards: Array<ModelCardInterface & { model: ModelInterface }>
  }
}

export const getModels = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelsResponse>) => {
    const {
      query: { libraries, filters, search, task },
    } = parse(req, getModelsSchema)

    const cards = await searchModels(req.user, libraries, filters, search, task)

    return res.json({ data: { cards } })
  },
]
