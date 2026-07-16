export function deepFreeze(object) {
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

export function removeEmptyValues(value) {
  if (value === '') {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map(removeEmptyValues).filter((item) => item !== undefined)
  }

  if (value !== null && typeof value === 'object') {
    const cleaned = Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeEmptyValues(item)])
        .filter(([, item]) => item !== undefined),
    )

    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  }

  return value
}
