import SchemaModel from '../../models/Schema'
import { Request, Response } from 'express'
import { ensureUserRole } from '../../utils/user'

export const getSchemas = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    if (!req.query.use) {
      req.log.warn(`Request did not have 'use' field`)
      return res.status(404).json({
        message: `Requires 'use' field to be provided'`,
      })
    }

    const schemas = await SchemaModel.find({ use: req.query.use })

    return res.json(schemas)
  },
]

export const getDefaultSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    if (!req.query.use) {
      req.log.warn(`Request did not have 'use' field`)
      return res.status(404).json({
        message: `Requires 'use' field to be provided'`,
      })
    }

    const schema = await SchemaModel.find({ use: req.query.use }).sort({ createdAt: -1 }).limit(1)

    if (!schema.length) {
      req.log.error({ use: req.query.use }, `Could not find default schema`)
      return res.status(404).json({
        message: 'No schemas found.',
      })
    }

    return res.json(schema[0])
  },
]

export const getSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { ref } = req.params

    const schema = await SchemaModel.findOne({ reference: decodeURIComponent(ref) })

    if (!schema) {
      req.log.warn({ use: req.query.use }, `Could not find given schema`)
      return res.status(404).json({
        message: 'No schema found.',
      })
    }

    return res.json(schema)
  },
]