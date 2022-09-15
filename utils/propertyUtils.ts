import { formatDateString } from './dateUtils'
import isObject from './isObject'
import { consoleError } from './logging'

const PROP_NOT_FOUND = 'Property not Found'
const PROP_NOT_HANDLED_TYPE = 'Property not a Handled Type: '
const PROP_NOT_ARRAY_TYPE = 'Property not an Array Type: '

type Property = {
  key: string
  value: unknown
  name?: string
}

const isPropertyObject = (obj: unknown): obj is Property =>
  !!(obj && (obj as Property).key !== undefined && (obj as Property).value !== undefined)

const printProperty = (prop: unknown, allowArrays = false, allowObjects = false, isOptional = false, format = '') => {
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
  if (allowObjects && isObject(prop)) {
    const keys = Object.keys(prop)
    if (keys.length === 2 && isPropertyObject(prop)) {
      const key = prop.name || prop.key
      if (key) {
        return `${key}: ${prop.value}`
      }
    }
    return keys
      .map((key) => `${key}: ${printProperty(prop[key], undefined, undefined, undefined, undefined)}`)
      .join(', ')
  }
  consoleError('Unhandled prop: ', prop)
  return PROP_NOT_HANDLED_TYPE + typeof prop
}

const printPropertyOptional = (prop: unknown) => printProperty(prop, false, false, true, undefined)

const printPropertyArray = (prop: unknown, isOptional = false) => {
  if (!prop) {
    if (isOptional) {
      return null
    }
    return PROP_NOT_FOUND
  }
  if (Array.isArray(prop)) {
    return prop.join(', ')
  }
  consoleError('Not array prop: ', prop)
  return PROP_NOT_ARRAY_TYPE + typeof prop
}

const printPropertyObject = (prop: unknown, isOptional = false) =>
  printProperty(prop, true, true, isOptional, undefined)

const printPropertyArrayOfObjects = (prop: unknown, isOptional = false) => {
  if (!prop) {
    if (isOptional) {
      return null
    }
    return PROP_NOT_FOUND
  }
  if (!Array.isArray(prop)) {
    consoleError('Not array prop: ', prop)
    return PROP_NOT_ARRAY_TYPE + typeof prop
  }
  return prop.map((obj) => printPropertyObject(obj)).join(', ')
}

export { printProperty, printPropertyArray, printPropertyObject, printPropertyArrayOfObjects, printPropertyOptional }
