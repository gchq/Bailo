import { formatDateString } from './dateUtils'

const PROP_NOT_FOUND = 'Property not Found'
const PROP_NOT_HANDLED_TYPE = 'Property not a Handled Type: '
const PROP_NOT_ARRAY_TYPE = 'Property not an Array Type: '

const printProperty = (prop: any, allowArrays: any, allowObjects: any, isOptional: any, format: any) => {
  if (prop == null) {
    if (isOptional) {
      return null
    }
    return PROP_NOT_FOUND
  }
  if (typeof prop === 'string') {
    if (format === 'date-time') {
      return formatDateString(prop)
    }
    return prop
  }
  if (typeof prop === 'boolean') {
    return prop ? 'Yes' : 'No'
  }
  if (typeof prop === 'number') {
    return `${prop}`
  }
  if (allowArrays && Array.isArray(prop)) {
    return prop.map((p) => printProperty(p, allowArrays, allowObjects, isOptional, undefined)).join(', ')
  }
  if (allowObjects && !Array.isArray(prop)) {
    const keys = Object.keys(prop)
    if (keys.length === 2 && keys.indexOf('value') > -1) {
      const key = prop.name || prop.key
      if (key) {
        return `${key}: ${prop.value}`
      }
    }
    return keys
      .map((key) => `${key}: ${printProperty(prop[key], undefined, undefined, undefined, undefined)}`)
      .join(', ')
  }
  console.error('Unhandled prop:')
  console.error(prop)
  return PROP_NOT_HANDLED_TYPE + typeof prop
}

const printPropertyOptional = (prop: any) => printProperty(prop, false, false, true, undefined)

const printPropertyArray = (prop: any, isOptional: any) => {
  if (!prop) {
    if (isOptional) {
      return null
    }
    return PROP_NOT_FOUND
  }
  if (Array.isArray(prop)) {
    return prop.join(', ')
  }
  console.error('Not array prop:')
  console.error(prop)
  return PROP_NOT_ARRAY_TYPE + typeof prop
}

const printPropertyObject = (prop: any, isOptional: any) => printProperty(prop, true, true, isOptional, undefined)

const printPropertyArrayOfObjects = (prop: any, isOptional: any) => {
  if (!prop) {
    if (isOptional) {
      return null
    }
    return PROP_NOT_FOUND
  }
  if (!Array.isArray(prop)) {
    console.error('Not array prop:')
    console.error(prop)
    return PROP_NOT_ARRAY_TYPE + typeof prop
  }
  return prop.map(printPropertyObject).join(', ')
}

export { printProperty, printPropertyArray, printPropertyObject, printPropertyArrayOfObjects, printPropertyOptional }
