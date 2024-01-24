export const toTitleCaseFromCamelCase = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`.split(/(?=[A-Z])/).join(' ')
}
