export const formatDate = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-GB')
}
