import _ from 'lodash'

/**
 * Replaces the default ui widgets with specific ones for certain properties
 *
 * todo - improve handling of multiple different components, the lodash mergeWith
 * function merges two objects with the second object taking priority over the first
 * if two properties share the same name.
 **/
export function ammendUiSchema(schema: any, formType: string) {
  const ammendedTextAreasSchema: any = ammendTextareas(schema)
  const ammendedContactsSchema: any = ammendContacts(schema)

  let uiSchema = _.mergeWith({}, ammendedTextAreasSchema, ammendedContactsSchema, (a, b) =>
    b === null ? a : undefined
  )

  if (formType === 'edit') {
    const ammendedEditVersionSchema: any = ammendSchemaForNewVersion(schema)
    uiSchema = _.mergeWith({}, uiSchema, ammendedEditVersionSchema, (a, b) => (b === null ? a : undefined))
  }

  return uiSchema
}

// When editing a version, the modelCardVersion field should be hidden
function ammendSchemaForNewVersion(schema: any) {
  if (!schema) {
    return
  }
  if (schema.title === 'Model version') {
    return { 'ui:widget': 'nothing' }
  }
  const parsedData = {}
  if (schema.type === 'object') {
    Object.keys(schema.properties).forEach((item) => {
      parsedData[item] = ammendSchemaForNewVersion(schema.properties[item])
    })
  }
  return parsedData
}

// When we don't define a maxLength attribute we should assume a large text field is needed
function ammendTextareas(schema: any) {
  if (!schema) {
    return
  }
  if (schema.maxLength === undefined && schema.type === 'string') {
    return { 'ui:widget': 'textareaWidget' }
  }
  const parsedData = {}
  if (schema.type === 'object') {
    Object.keys(schema.properties).forEach((item) => {
      parsedData[item] = ammendTextareas(schema.properties[item])
    })
  }
  return parsedData
}

// The contact fields need to be custom to allow for the user picker component
function ammendContacts(schema: any) {
  if (!schema) {
    return
  }
  if (schema.title === 'Contacts' || schema.title === 'Deployment Contacts') {
    return {
      uploader: { 'ui:widget': 'userSelector' },
      reviewer: { 'ui:widget': 'userSelector' },
      manager: { 'ui:widget': 'userSelector' },
      requester: { 'ui:widget': 'userSelector' },
      secondPOC: { 'ui:widget': 'userSelector' },
    }
  }
  const parsedData = {}
  if (schema.type === 'object') {
    Object.keys(schema.properties).forEach((item) => {
      parsedData[item] = ammendContacts(schema.properties[item])
    })
  }
  return parsedData
}
