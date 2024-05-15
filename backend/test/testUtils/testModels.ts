import { Decision } from '../../src/models/Review.js'
import { ReviewKind, SchemaKind } from '../../src/types/enums.js'

export const testModelSchema = {
  id: 'example-model-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: SchemaKind.Model,
  jsonSchema: {
    properties: {
      overview: {
        title: 'Overview',
        description: 'Summary of the model functionality.',
        type: 'object',
        properties: {
          name: {
            title: 'Name of the Machine Learning Model',
            description:
              "This should be descriptive name, such as 'Arabic - English Translation', and will be visible in the model marketplace.",
            type: 'string',
            minLength: 1,
            maxLength: 140,
            widget: 'customTextInput',
          },
        },
      },
    },
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

export const testAccessRequestReviewWithResponses = {
  modelId: 'abc',
  accessRequestId: 'test-235',
  kind: ReviewKind.Access,
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

export const testModelCardRevision = {
  modelId: 'abc',
  CreatedBy: 'user',
  createdAt: '2023-11-17T14:25:39.004Z',
}
