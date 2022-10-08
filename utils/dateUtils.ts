export const formatDate = (date: Date) => date.toLocaleDateString('en-GB')

export const formatDateString = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-GB')
}

export const plural = (value: number, phrase: string) => `${value} ${phrase}${value === 1 ? '' : 's'}`

export const timeDifference = (current: Date, previous: Date) => {
  const msPerMinute = 60 * 1000
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerMonth = msPerDay * 30
  const msPerYear = msPerDay * 365

  const elapsed = Number(current) - Number(previous)

  if (elapsed < msPerMinute) {
    return `${plural(Math.round(elapsed / 1000), 'sec')} ago`
  }

  if (elapsed < msPerHour) {
    return `${plural(Math.round(elapsed / msPerMinute), 'min')} ago`
  }

  if (elapsed < msPerDay) {
    return `${plural(Math.round(elapsed / msPerHour), 'hour')} ago`
  }

  if (elapsed < msPerMonth) {
    return `${plural(Math.round(elapsed / msPerDay), 'day')} ago`
  }

  if (elapsed < msPerYear) {
    return `${plural(Math.round(elapsed / msPerMonth), 'month')} ago`
  }

  return `${plural(Math.round(elapsed / msPerYear), 'year')} ago`
}
