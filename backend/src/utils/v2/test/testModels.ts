export const mockModelSchema = {
  id: 'example-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: 'model',
  meta: { example: true },

  uiSchema: {
    'UI Schema field 1': 'field 1 info',
  },
  schema: {
    'Schema field 1': 'field 1 info',
  },

  createdAt: '2023-07-28T10:50:00.928Z',
  updatedAt: '2023-07-28T10:50:00.928Z',
}

export const mockDeploymentSchema = {
  id: 'example-schema-1',
  name: 'Example Schema 1',
  description: 'This is a description of the schema.',

  active: true,
  hidden: false,

  kind: 'deployment',
  meta: { example: true },

  uiSchema: {
    'UI Schema field 1': 'field 1 info',
  },
  schema: {
    'Schema field 1': 'field 1 info',
  },

  createdAt: '2023-07-28T10:50:00.928Z',
  updatedAt: '2023-07-28T10:50:00.928Z',
}
