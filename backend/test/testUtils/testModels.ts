import { SchemaKind } from '../../src/types/v2/enums.js'

export const testModelSchema = {
  id: 'example-model-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: SchemaKind.Model,
  meta: { example: true },

  uiSchema: {
    'UI Schema field 1': 'field 1 info',
  },
  schema: {
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

  kind: SchemaKind.Deployment,
  meta: { example: true },

  uiSchema: {
    'UI Schema field 1': 'field 1 info',
  },
  schema: {
    'Schema field 1': 'field 1 info',
  },

  createdAt: new Date('2023-07-28T10:50:00.928Z'),
  updatedAt: new Date('2023-07-28T10:50:00.928Z'),
}

export const testReleaseInactiveApproval = {
  model: 'example-model-2-nevwg4',
  release: '3.0.2',
  kind: 'release',
  active: false,
  createdAt: new Date('08/13/2023'),
  updatedAt: new Date('08/14/2023'),
}

export const testReleaseActiveApproval = {
  model: 'example-model-2-nevwg4',
  release: '3.0.2',
  kind: 'release',
  active: true,
  createdAt: new Date('08/13/2023'),
  updatedAt: new Date('08/14/2023'),
}
