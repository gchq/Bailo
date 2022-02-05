import SchemaModel from '../../models/Schema'
import { Request, Response } from 'express'
import { ensureUserRole } from '../../utils/user'
import { NotFound } from 'server/utils/result'

export const getSchemas = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    if (!req.query.use) {
      throw NotFound({}, `Requires 'use' field to be provided.`)
    }

    const schemas = await SchemaModel.find({ use: req.query.use })

    return res.json(schemas)
  },
]

export const getDefaultSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    if (!req.query.use) {
      throw NotFound({}, `Requires 'use' field to be provided`)
    }

    const schema = await SchemaModel.find({ use: req.query.use }).sort({ createdAt: -1 }).limit(1)

    if (!schema.length) {
      throw NotFound({}, `Could not find default schema`)
    }

    return res.json(schema[0])
  },
]
