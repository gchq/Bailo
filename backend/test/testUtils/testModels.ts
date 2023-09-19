import { Decision } from '../../src/models/v2/Review.js'
import { ReviewKind, SchemaKind } from '../../src/types/v2/enums.js'

export const testModelSchema = {
  id: 'example-model-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: SchemaKind.Model,
  jsonSchema: {
    'Schema field 1': 'field 1 info',
  },

  createdAt: new Date('2023-07-28T10:50:00.928Z'),
  updatedAt: new Date('2023-07-28T10:50:00.928Z'),
}

export const testDeploymentSchema = {
  id: 'example-deployment-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: SchemaKind.AccessRequest,
  jsonSchema: {
    'Schema field 1': 'field 1 info',
  },

  createdAt: new Date('2023-07-28T10:50:00.928Z'),
  updatedAt: new Date('2023-07-28T10:50:00.928Z'),
}

export const testReleaseReviewWithResponses = {
  modelId: 'abc',
  semver: '3.0.2',
  kind: ReviewKind.Release,
  responses: [
    {
      user: 'user',
      decision: Decision.Approve,
      comment: 'looks amazing!',
    },
  ],

  role: 'msro',

  createdAt: new Date('08/13/2023'),
  updatedAt: new Date('08/14/2023'),
}

export const testReleaseReview = {
  modelId: 'abc',
  semver: '3.0.3',
  kind: ReviewKind.Release,

  role: 'msro',
  responses: [],
  createdAt: new Date('08/13/2023'),
  updatedAt: new Date('08/14/2023'),
}
