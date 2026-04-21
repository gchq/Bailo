export async function asyncFilter<T>(arr: Array<T>, predicate: (v: T) => Promise<boolean>): Promise<Array<T>> {
  return Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]))
}

export function findDuplicates<T>(arr: Array<T>): Array<T> {
  // NOTE: Items are compared for equality.  For primitives this is their values, otherwise
  // it will check for reference equality.
  //
  // This is intentionally not an efficient implementation and is O(n^2).
  return arr.filter((item, index) => arr.indexOf(item) !== index)
}

/**
 * Deduplicate an array while preserving order, using a custom key function.
 * Uses SameValueZero equality (as per Set).
 */
export function dedupeByKey<T, K>(input: readonly T[], keyFn: (item: T) => K = (item) => item as unknown as K): T[] {
  const seen = new Set<K>()
  const result: T[] = []

  for (const item of input) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}
