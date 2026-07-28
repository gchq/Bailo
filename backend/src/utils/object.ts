import { mergeWith } from 'lodash-es'

export function deepFreeze(object: object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object)

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name]

    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value)
    }
  }

  return Object.freeze(object)
}

export function getPropValue<T = unknown>(source: unknown, path: string): T | undefined {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return source as T
  }
  return trimmedPath.split('.').reduce<any>((acc, key) => {
    return acc != null ? acc[key] : undefined
  }, source)
}

export function deepMergePreferFirst<T extends object, U extends object>(first: T, second: U): T & U {
  return mergeWith({}, second, first, (objValue, srcValue) => {
    // Arrays: first object wins completely
    if (Array.isArray(objValue) || Array.isArray(srcValue)) {
      return srcValue ?? objValue
    }

    // Primitives: first object wins when present
    if (srcValue !== undefined && (srcValue === null || typeof srcValue !== 'object')) {
      return srcValue
    }

    // Return undefined to let lodash continue normal deep merge.
    return undefined
  }) as T & U
}
