import dayjs, { Dayjs } from '@dayjs'
import { plural } from 'utils/stringUtils'

export const utcDate = (value: string) => {
  return dayjs.utc(value)
}

export const utcStartOfDate = (value: string) => {
  return dayjs.utc(value).startOf('day')
}

export const utcStartOfCurrentDate = () => {
  return dayjs.utc().startOf('day')
}

export const utcStartOfDateISOString = (date: Dayjs) => {
  return date.utc().startOf('day').toISOString()
}

export const formatDate = (date: Date) => {
  return date.toDateString()
}

export const formatDateTime = (date: Date) => {
  return date.toUTCString()
}

export const formatDateString = (value: string) => {
  const date = new Date(value)
  return formatDate(date)
}

export const formatDateTimeString = (value: string) => {
  const date = new Date(value)
  return formatDateTime(date)
}

export const formatDateStringWithMinutes = (value: string) => {
  return dayjs(value).format('DD/MM/YY HH:mm:ss').toString()
}

export const formatDateStringAsMonthAndYear = (value: string) => {
  return dayjs(value).format('MMM YYYY')
}

export const formatDateStringAsDayMonthAndYear = (value: string) => {
  return dayjs(value).format('DD/MM/YYYY')
}

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

export const setAsFirstDayOfMonth = (date: Dayjs): string => {
  return date.date(1).toISOString().split('T')[0]
}

export const setAsLastDayOfMonth = (date: Dayjs): string => {
  return date.endOf('month').toISOString().split('T')[0]
}

export const increaseCurrentDateInDays = (daysToAdd: number) => {
  const currentDate = dayjs(new Date())
  return currentDate.add(daysToAdd, 'day')
}
