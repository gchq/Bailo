export async function asyncFilter<T>(arr: Array<T>, predicate: any): Promise<Array<T>> {
  return Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]))
}

export function getPropertyFromEnumValue<Enum extends { [key: string]: string | number }>(
  t: Enum,
  key: string
): string | undefined {
  const entries = Object.entries(t)

  for (const [index, value] of entries) {
    if (value === key) {
      return index
    }
  }

  return undefined
}
