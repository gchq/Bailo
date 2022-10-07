export const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
