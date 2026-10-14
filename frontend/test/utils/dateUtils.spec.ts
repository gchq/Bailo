import dayjs from '@dayjs'
import {
  formatDate,
  formatDateString,
  formatDateStringAsDayMonthAndYear,
  formatDateStringAsMonthAndYear,
  formatDateStringWithMinutes,
  formatDateTime,
  formatDateTimeString,
  increaseCurrentDateByHumanInterval,
  isOverdue,
  setAsFirstDayOfMonth,
  setAsLastDayOfMonth,
  timeDifference,
  utcDate,
  utcStartOfDate,
  utcStartOfDateISOString,
} from 'utils/dateUtils'
import { describe, expect, test, vi } from 'vitest'

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30

vi.mock('human-interval', () => ({
  default: (interval: string) => {
    if (interval === '1 year') {
      return ONE_YEAR_MS
    }
    if (interval === '30 days') {
      return THIRTY_DAYS_MS
    }
    return undefined
  },
}))

describe('dateUtils', () => {
  describe('utcDate', () => {
    test('parses a date string as UTC', () => {
      const result = utcDate('2024-06-15')
      expect(result.format('YYYY-MM-DD')).toBe('2024-06-15')
      expect(result.isUTC()).toBe(true)
    })
  })

  describe('utcStartOfDate', () => {
    test('returns start of day in UTC', () => {
      const result = utcStartOfDate('2024-06-15T14:30:00Z')
      expect(result.hour()).toBe(0)
      expect(result.minute()).toBe(0)
      expect(result.second()).toBe(0)
    })
  })

  describe('utcStartOfDateISOString', () => {
    test('returns ISO string at start of day in UTC', () => {
      const date = dayjs.utc('2024-06-15T14:30:00Z')
      const result = utcStartOfDateISOString(date)
      expect(result).toBe('2024-06-15T00:00:00.000Z')
    })
  })

  describe('formatDate', () => {
    test('formats a Date object as a date string', () => {
      const date = new Date('2024-06-15T00:00:00Z')
      const result = formatDate(date)
      expect(result).toBe(date.toDateString())
    })
  })

  describe('formatDateTime', () => {
    test('formats a Date object as a UTC string', () => {
      const date = new Date('2024-06-15T14:30:00Z')
      const result = formatDateTime(date)
      expect(result).toBe('Sat, 15 Jun 2024 14:30:00 GMT')
    })
  })

  describe('formatDateString', () => {
    test('formats a date string as a date', () => {
      const result = formatDateString('2024-06-15T00:00:00Z')
      expect(result).toBe(new Date('2024-06-15T00:00:00Z').toDateString())
    })
  })

  describe('formatDateTimeString', () => {
    test('formats a date string as a UTC datetime', () => {
      const result = formatDateTimeString('2024-06-15T14:30:00Z')
      expect(result).toBe('Sat, 15 Jun 2024 14:30:00 GMT')
    })
  })

  describe('formatDateStringWithMinutes', () => {
    test('formats a date string with minutes and seconds', () => {
      const result = formatDateStringWithMinutes('2024-06-15T14:30:45Z')
      expect(result).toMatch(/15\/06\/24 \d{2}:\d{2}:\d{2}/)
    })
  })

  describe('formatDateStringAsMonthAndYear', () => {
    test('formats a date string as month and year', () => {
      const result = formatDateStringAsMonthAndYear('2024-06-15')
      expect(result).toBe('Jun 2024')
    })
  })

  describe('formatDateStringAsDayMonthAndYear', () => {
    test('formats a date string as day/month/year', () => {
      const result = formatDateStringAsDayMonthAndYear('2024-06-15')
      expect(result).toBe('15/06/2024')
    })
  })

  describe('timeDifference', () => {
    test('returns seconds ago for very recent times', () => {
      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)
      expect(timeDifference(now, thirtySecondsAgo)).toBe('30 secs ago')
    })

    test('returns 1 sec ago for singular', () => {
      const now = new Date()
      const oneSecondAgo = new Date(now.getTime() - 1000)
      expect(timeDifference(now, oneSecondAgo)).toBe('1 sec ago')
    })

    test('returns minutes ago', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(timeDifference(now, fiveMinutesAgo)).toBe('5 mins ago')
    })

    test('returns hours ago', () => {
      const now = new Date()
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
      expect(timeDifference(now, threeHoursAgo)).toBe('3 hours ago')
    })

    test('returns days ago', () => {
      const now = new Date()
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      expect(timeDifference(now, tenDaysAgo)).toBe('10 days ago')
    })

    test('returns months ago', () => {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      expect(timeDifference(now, threeMonthsAgo)).toBe('3 months ago')
    })

    test('returns years ago', () => {
      const now = new Date()
      const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
      expect(timeDifference(now, twoYearsAgo)).toBe('2 years ago')
    })
  })

  describe('setAsFirstDayOfMonth', () => {
    test('sets date to first day of month', () => {
      const date = dayjs('2024-06-15')
      expect(setAsFirstDayOfMonth(date)).toBe('2024-06-01')
    })
  })

  describe('setAsLastDayOfMonth', () => {
    test('sets date to last day of month', () => {
      const date = dayjs('2024-06-15')
      expect(setAsLastDayOfMonth(date)).toBe('2024-06-30')
    })

    test('handles February in a leap year', () => {
      const date = dayjs('2024-02-10')
      expect(setAsLastDayOfMonth(date)).toBe('2024-02-29')
    })

    test('handles February in a non-leap year', () => {
      const date = dayjs('2023-02-10')
      expect(setAsLastDayOfMonth(date)).toBe('2023-02-28')
    })
  })

  describe('increaseCurrentDateByHumanInterval', () => {
    test('increases current date by a valid human interval', () => {
      const before = Date.now()
      const result = increaseCurrentDateByHumanInterval('1 year')

      expect(result.valueOf()).toBeGreaterThanOrEqual(before + ONE_YEAR_MS)
      expect(result.valueOf()).toBeLessThanOrEqual(Date.now() + ONE_YEAR_MS)
    })

    test('increases current date by a shorter interval', () => {
      const before = Date.now()
      const result = increaseCurrentDateByHumanInterval('30 days')

      expect(result.valueOf()).toBeGreaterThanOrEqual(before + THIRTY_DAYS_MS)
      expect(result.valueOf()).toBeLessThanOrEqual(Date.now() + THIRTY_DAYS_MS)
    })

    test('returns current date for an invalid interval', () => {
      const before = Date.now()
      const result = increaseCurrentDateByHumanInterval('not a real interval')

      expect(result.valueOf()).toBeGreaterThanOrEqual(before)
      expect(result.valueOf()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('isOverdue', () => {
    test('returns true for a past date', () => {
      expect(isOverdue('2020-01-01')).toBe(true)
    })

    test('returns false for a future date', () => {
      expect(isOverdue('2099-01-01')).toBe(false)
    })

    test('returns false for today', () => {
      const today = new Date().toISOString()
      expect(isOverdue(today)).toBe(false)
    })
  })
})
