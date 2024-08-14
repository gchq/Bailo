export const toSentenceCase = (value: string): string => {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`.replace(/[-_]/g, ' ')
}
