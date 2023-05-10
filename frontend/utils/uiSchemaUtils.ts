import { merge } from 'lodash-es'

export function createUiSchema(schema: any, customSchema: any) {
  const baseUiSchema = createBaseSchema(schema)
  const uiSchema = merge(baseUiSchema, customSchema)

  return uiSchema
}

export function createBaseSchema(schema: any) {
  const uiSchema = {}

  if (schema.maxLength > 140) {
    uiSchema['ui:widget'] = 'textarea'
  }

  if (schema.widget) {
    uiSchema['ui:widget'] = schema.widget
  }

  if (schema.type === 'object') {
    for (const [property, value] of Object.entries(schema.properties)) {
      uiSchema[property] = createBaseSchema(value)
    }
  }

  return uiSchema
}
