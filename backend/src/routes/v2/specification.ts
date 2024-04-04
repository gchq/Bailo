import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { Request, Response } from 'express'

import { registry } from '../../services/specification.js'
import config from '../../utils/config.js'

export const getSpecification = [
  async (_req: Request, res: Response) => {
    const generator = new OpenApiGeneratorV3(registry.definitions)
    const tags = [
      {
        name: 'model',
        description:
          'A model object is the primary object within Bailo.  It contains the modelcard, settings and high level details about the model.',
      },
      {
        name: 'access-request',
        description:
          'An access request is required when attempting to download files and images associated with a model.  It tracks users requests to use a model.',
      },
      {
        name: 'file',
        description:
          'A file represents an object kept in our storage.  It contains metadata about the file, as well as where it is stored.  These are usually attached to releases.',
      },
      {
        name: 'image',
        description:
          'Image endpoints usually interact with our Docker registry, which includes a variety of images related to models.  Similarly to files, these are usually found attached to releases.',
      },
      {
        name: 'modelcard',
        description:
          'A modelcard stores information about how a model was created, how to use it and more.  The contents of a model card is configurable by using different schemas.',
      },
      {
        name: 'release',
        description:
          'A release contains includes files and images, a specific version of a model card and approval information.  It should be used to track the versioning of a model.',
      },
      {
        name: 'review',
        description:
          'The review endpoints allow users to approve or reject releases and access requests.  Multiple different groups can be setup to approve each request.',
      },
      {
        name: 'schema',
        description:
          'Schemas are used to define what contents a model card should contain.  They follow the JsonSchema specification.',
      },
      {
        name: 'token',
        description:
          'Tokens are used to grant access to models.  They give constrained permissions to Bailo, allowing fine-grained permissions for deployments.',
      },
      {
        name: 'user',
        description: 'A user represents an individual who has accessed this service.',
      },
    ]

    if (config.ui.inference.enabled) {
      tags.push({
        name: 'inference',
        description:
          'An inference service is used to run models within Bailo. Each contains settings for a specific configuration',
      })
    }

    res.json(
      generator.generateDocument({
        openapi: '3.0.0',
        info: {
          version: '2.0.0',
          title: 'Bailo API',
        },
        tags: tags,
      }),
    )
  },
]
