import { merge } from 'lodash-es'

export function createUiSchema(schema: any, customSchema: any) {
  const baseUiSchema = createBaseSchema(schema)
  const uiSchema = merge(baseUiSchema, customSchema)

  return uiSchema
}

function createBaseSchema(schema: any) {
  const uiSchema = {}

  if (schema.maxLength > 140) {
    uiSchema['ui:widget'] = 'textarea'
  }

  if (schema.widget) {
    uiSchema['ui:widget'] = schema.widget
  }

  if (schema.field) {
    uiSchema['ui:field'] = schema.field
  }

  if (schema.type === 'object') {
    for (const [property, value] of Object.entries(schema.properties)) {
      uiSchema[property] = createBaseSchema(value)
    }
  }

  if (schema.type === 'array') {
    for (const [arrayProperty, arrayValue] of Object.entries(schema.items)) {
      if (arrayProperty === 'type' && arrayValue === 'object') {
        for (const [property, value] of Object.entries(schema.items.properties)) {
          if (!uiSchema['items']) {
            uiSchema['items'] = {}
          }
          uiSchema['items'][property] = createBaseSchema(value)
        }
      }
    }
  }

  return uiSchema
}
