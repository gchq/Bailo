export const sortByNameAscending = <T extends { name: string }>(a: T, b: T) => {
  return a.name.localeCompare(b.name)
}
