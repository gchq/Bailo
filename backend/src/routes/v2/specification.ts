import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { Request, Response } from 'express'

import { registry } from '../../services/v2/specification.js'

export const getSpecification = [
  async (_req: Request, res: Response) => {
    const generator = new OpenApiGeneratorV3(registry.definitions)

    res.json(
      generator.generateDocument({
        openapi: '3.1.0',
        info: {
          version: '2.0.0',
          title: 'Bailo API',
        },
        tags: [
          {
            name: 'model',
            description:
              'A model object is the primary object within Bailo.  It contains the modelcard, settings and high level details about the model.',
          },
        ],
      }),
    )
  },
]
