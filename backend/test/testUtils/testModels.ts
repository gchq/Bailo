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

export const testReviewResponse = {
  comment: 'test comment',
  user: 'user',
  parentId: '66854110aab20df2b7481a82',
  role: 'mtr',
  decision: 'approve',
  kind: ReviewKind.Release,
  createdAt: '2024-05-17T06:13:41.690Z',
  updatedAt: '2024-05-17T06:13:41.690Z',
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

export const testAccessRequestReview = {
  modelId: 'abc',
  accessRequestId: 'cba',
  kind: ReviewKind.Access,

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

export const testAccessRequest = {
  _id: '664e1aa8bda1f88c28e1c0ce',
  id: 'test-access-request-13623',
  modelId: 'test-model-4342',
}

export const testRelease = {
  modelId: 'test-model-1124',
  semver: '1.0.0',
}

export const testResponse = {
  message: 'test comment',
  user: 'user',
  createdAt: '2024-05-17T06:13:41.690Z',
  _id: '6646f5953391b094ca4f55ee',
}

export const testReviewRole = {
  id: 'my-role-125',
  name: 'Reviewer',
  short: 'reviewer',
}
