import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  addInterval,
  buildModelMatchStage,
  buildReleaseKey,
  getActiveRoleSet,
  getApplicableRoleSet,
  getModelOwners,
  semverToString,
} from '../../../src/connectors/metrics/metricUtils.js'
import { SystemRoles } from '../../../src/models/Model.js'

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
    const result = getApplicableRoleSet({ schema1: ['owner'] }, undefined)

    expect(Array.from(result)).toEqual([])
  })

  test('includes schema roles when schemaId exists in schemaRoleMap', () => {
    const result = getApplicableRoleSet({ schema1: ['msro', 'mtr'] }, 'schema1')

    expect(new Set(result)).toEqual(new Set(['msro', 'mtr']))
  })

  test('removes duplicates via Set', () => {
    const result = getApplicableRoleSet({ schema1: ['mtr', 'mtr', 'owner'] }, 'schema1')

    expect(new Set(result)).toEqual(new Set(['mtr', 'owner']))
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

describe('connectors > metrics > metricUtils > getModelOwners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns collaborators with the Owner role', () => {
    const collaborators = [
      { entity: 'user1', roles: [SystemRoles.Owner] },
      { entity: 'user2', roles: ['msro'] },
      { entity: 'user3', roles: [SystemRoles.Owner, 'mtr'] },
    ]

    const result = getModelOwners(collaborators)

    expect(result).toEqual(['user1', 'user3'])
  })

  test('returns empty array when no owners exist', () => {
    const collaborators = [{ entity: 'user1', roles: ['msro'] }]

    const result = getModelOwners(collaborators)

    expect(result).toEqual([])
  })

  test('handles undefined collaborators', () => {
    const result = getModelOwners(undefined)

    expect(result).toEqual([])
  })
})

describe('connectors > metrics > metricUtils > buildReleaseKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('builds a unique release key from model id and semver', () => {
    const result = buildReleaseKey('model-123', '1.2.3')

    expect(result).toBe('model-123::1.2.3')
  })
})

describe('connectors > metrics > metricUtils > semverToString', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns string semvers unchanged', () => {
    const result = semverToString('1.2.3')

    expect(result).toBe('1.2.3')
  })

  test('converts semver objects to strings', () => {
    const result = semverToString({
      major: 1,
      minor: 2,
      patch: 3,
    })

    expect(result).toBe('1.2.3')
  })
})
