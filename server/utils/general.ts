export async function asyncFilter<T>(arr: Array<T>, predicate: any): Promise<Array<T>> {
  return Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]))
}
