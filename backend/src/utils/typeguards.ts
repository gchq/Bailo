export function hasKeys<T extends object>(obj: unknown, keys: Array<keyof T>): obj is T {
  return typeof obj === 'object' && obj !== null && keys.every((k) => k in obj)
}

export function hasKeysOfType<T extends object>(obj: unknown, keyTypes: Record<keyof T, string>): obj is T {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.entries(keyTypes).every(([k, type]) => typeof (obj as any)[k] === type)
  )
}

export function arrayOfObjectsHasKeys<T extends object>(arr: unknown, keys: Array<keyof T>): arr is T[] {
  return Array.isArray(arr) && arr.every((item) => hasKeys(item, keys))
}
