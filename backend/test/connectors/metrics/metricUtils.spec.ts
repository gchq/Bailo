import { beforeEach, describe, expect, test, vi } from 'vitest'

import { addBucket, buildModelMatchStage } from '../../../src/connectors/metrics/metricUtils.js'

describe('connectors > metrics > metricUtils > addBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('adds one day', () => {
    const result = addBucket(new Date('2026-01-01T00:00:00.000Z'), 'day')

    expect(result.toISOString()).toBe('2026-01-02T00:00:00.000Z')
  })

  test('adds one week', () => {
    const result = addBucket(new Date('2026-01-01T00:00:00.000Z'), 'week')

    expect(result.toISOString()).toBe('2026-01-08T00:00:00.000Z')
  })

  test('adds one month', () => {
    const result = addBucket(new Date('2026-01-01T00:00:00.000Z'), 'month')

    expect(result.toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })

  test('adds one quarter (3 months)', () => {
    const result = addBucket(new Date('2026-01-01T00:00:00.000Z'), 'quarter')

    expect(result.toISOString()).toBe('2026-04-01T00:00:00.000Z')
  })

  test('adds one year', () => {
    const result = addBucket(new Date('2026-01-01T00:00:00.000Z'), 'year')

    expect(result.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('connectors > metrics > metricUtils > buildModelMatchStage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns empty match for undefined organisation (global)', () => {
    const result = buildModelMatchStage({})

    expect(result).toEqual({ $match: {} })
  })

  test('applies organisation filter when organisation is non-empty string', () => {
    const result = buildModelMatchStage({ organisation: 'Example Organisation' })

    expect(result).toEqual({
      $match: { organisation: 'Example Organisation' },
    })
  })

  test('applies organisation filter when organisation is empty string (unset)', () => {
    const result = buildModelMatchStage({ organisation: '' })

    expect(result).toEqual({
      $match: { organisation: '' },
    })
  })
})
