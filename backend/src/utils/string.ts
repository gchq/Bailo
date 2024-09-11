export const toTitleCase = (value: string): string => {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}
