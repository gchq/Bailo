import { Request, Response } from 'express'

import { generateSwaggerSpec } from '../../services/specification.js'

export const getSpecification = [
  async (_req: Request, res: Response) => {
    res.json(generateSwaggerSpec())
  },
]
