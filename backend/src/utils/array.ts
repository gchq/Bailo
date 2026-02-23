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
 * Returns the mode (most frequent value) of an array.
 * If multiple modes exist, returns the first encountered.
 * Returns undefined for an empty array.
 */
export function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) {
    return undefined
  }

  const counts = new Map<T, number>()
  let maxCount = 0
  let modeValue: T = arr[0]

  for (const item of arr) {
    const count = (counts.get(item) ?? 0) + 1
    counts.set(item, count)

    if (count > maxCount) {
      maxCount = count
      modeValue = item
    }
  }

  return modeValue
}
