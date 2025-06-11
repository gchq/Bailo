export function hasKeys<T extends object>(obj: unknown, keys: Array<keyof T>): obj is T {
  return typeof obj === 'object' && obj !== null && keys.every((k) => k in obj)
}

export function hasKeysOfType<T extends object>(obj: unknown, keyTypes: Record<keyof T, any>): obj is T {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false
  }
  const objRecord = obj as Record<keyof T, any>
  return (Object.entries(keyTypes) as [keyof T, string][]).every(([k, type]) => typeof objRecord[k] === type)
}

export function arrayOfObjectsHasKeys<T extends object>(arr: unknown, keys: Array<keyof T>): arr is T[] {
  return Array.isArray(arr) && arr.every((item) => hasKeys(item, keys))
}

export function arrayOfObjectsHasKeysOfType<T extends object>(
  arr: unknown,
  keyTypes: Record<keyof T, string>,
): arr is T[] {
  return Array.isArray(arr) && arr.every((item) => hasKeysOfType(item, keyTypes))
}
