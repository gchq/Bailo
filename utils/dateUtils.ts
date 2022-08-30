export const formatDate = (date: Date) => date.toLocaleDateString('en-GB')

export const formatDateString = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-GB')
}
