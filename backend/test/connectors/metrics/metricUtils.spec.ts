import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  addInterval,
  buildModelMatchStage,
  getActiveRoleSet,
  getApplicableRoleSet,
} from '../../../src/connectors/metrics/metricUtils.js'

describe('connectors > metrics > metricUtils > addInterval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('adds one day', () => {
    const result = addInterval(new Date('2026-01-01T00:00:00.000Z'), 'day')

    expect(result.toISOString()).toBe('2026-01-02T00:00:00.000Z')
  })

  test('adds one week', () => {
    const result = addInterval(new Date('2026-01-01T00:00:00.000Z'), 'week')

    expect(result.toISOString()).toBe('2026-01-08T00:00:00.000Z')
  })

  test('adds one month', () => {
    const result = addInterval(new Date('2026-01-01T00:00:00.000Z'), 'month')

    expect(result.toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })

  test('adds one quarter (3 months)', () => {
    const result = addInterval(new Date('2026-01-01T00:00:00.000Z'), 'quarter')

    expect(result.toISOString()).toBe('2026-04-01T00:00:00.000Z')
  })

  test('adds one year', () => {
    const result = addInterval(new Date('2026-01-01T00:00:00.000Z'), 'year')

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

describe('connectors > metrics > metricUtils > getApplicableRoleSet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns only default roles when schemaId is undefined', () => {
    const result = getApplicableRoleSet(['msro', 'mtr'], { schema1: ['md'] }, undefined)

    expect(Array.from(result)).toEqual(['msro', 'mtr'])
  })

  test('includes schema roles when schemaId exists in schemaRoleMap', () => {
    const result = getApplicableRoleSet(['msro', 'mtr'], { schema1: ['md'] }, 'schema1')

    expect(new Set(result)).toEqual(new Set(['msro', 'mtr', 'md']))
  })

  test('falls back to default roles when schemaId not found in schemaRoleMap', () => {
    const result = getApplicableRoleSet(['msro', 'mtr'], { schema1: ['md'] }, 'unknown')

    expect(Array.from(result)).toEqual(['msro', 'mtr'])
  })

  test('removes duplicates via Set', () => {
    const result = getApplicableRoleSet(['msro', 'mtr'], { schema1: ['mtr', 'md'] }, 'schema1')

    expect(new Set(result)).toEqual(new Set(['msro', 'mtr', 'md']))
  })
})

describe('connectors > metrics > metricUtils > getActiveRoleSet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('collects roles from collaborators', () => {
    const collaborators = [
      { entity: 'user1', roles: ['msro', 'mtr'] },
      { entity: 'user2', roles: ['md'] },
    ] as any

    const result = getActiveRoleSet(collaborators)

    expect(new Set(result)).toEqual(new Set(['msro', 'mtr', 'md']))
  })

  test('ignores empty and whitespace roles', () => {
    const collaborators = [{ entity: 'user1', roles: ['msro', '', '   '] }] as any

    const result = getActiveRoleSet(collaborators)

    expect(Array.from(result)).toEqual(['msro'])
  })

  test('handles collaborators with undefined roles', () => {
    const collaborators = [{ entity: 'user1', roles: undefined }] as any

    const result = getActiveRoleSet(collaborators)

    expect(Array.from(result)).toEqual([])
  })

  test('deduplicates roles across collaborators', () => {
    const collaborators = [
      { entity: 'user1', roles: ['msro'] },
      { entity: 'user2', roles: ['msro'] },
    ] as any

    const result = getActiveRoleSet(collaborators)

    expect(Array.from(result)).toEqual(['msro'])
  })
})
