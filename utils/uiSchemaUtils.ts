import { merge } from 'lodash'

export function createUiSchema(schema: any, customSchema: any) {
  const baseUiSchema = createBaseSchema(schema)
  const uiSchema = merge(baseUiSchema, customSchema)

  return uiSchema
}

export function createBaseSchema(schema: any) {
  let uiSchema = {}

  if (schema.maxLength) {
    uiSchema['ui:widget'] = 'textArea'
  }

  if (schema.widget) {
    uiSchema['ui:widget'] = schema.widget
  }

  if (schema.type === 'object') {
    for (let [property, value] of Object.entries(schema.properties)) {
      uiSchema[property] = createBaseSchema(value)
    }
  }

  return uiSchema
}
