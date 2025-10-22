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

export function getPropValue(sourceObject: any, dotNotationPath: string) {
  let returnData = sourceObject

  dotNotationPath.split('.').forEach((subPath) => {
    returnData = returnData[subPath] || undefined
  })
  return returnData
}
