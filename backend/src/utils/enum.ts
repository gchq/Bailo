export const getEnumValues = <T extends Record<string, unknown>>(obj: T) => {
  return Object.values(obj) as [(typeof obj)[keyof T]]
}
