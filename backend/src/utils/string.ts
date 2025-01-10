export const plural = (value: number, phrase: string) => {
  return `${value} ${phrase}${value === 1 ? '' : 's'}`
}
