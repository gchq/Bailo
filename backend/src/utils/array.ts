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
