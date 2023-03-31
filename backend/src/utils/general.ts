export async function asyncFilter<T>(arr: Array<T>, predicate: any): Promise<Array<T>> {
  return Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]))
}

export function getPropertyFromEnumValue<Enum extends { [key: string]: string | number }>(
  t: Enum,
  key: string
): string | undefined {
  const values = Object.values(t)

  for (const value of values) {
    if (value === key) {
      return value
    }
  }
  return undefined
}
