import { beforeEach, describe, expect, test, vi } from 'vitest'

import { BadReq } from '../../../src/utils/error.js'

async function loadConnector() {
  return await import('../../../src/connectors/metrics/base.js')
}

vi.mock('../../../src/models/Model.js')
vi.mock('../../../src/models/Release.js')
vi.mock('../../../src/models/AccessRequest.js')
vi.mock('../../../src/services/model.js')
vi.mock('../../../src/services/schema.js')
vi.mock('../../../src/models/Schema.js')
vi.mock('../../../src/models/ReviewRole.js')
vi.mock('../../../src/models/Review.js')
vi.mock('../../../src/models/Response.js')

const modelMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  distinct: vi.fn(),
  find: vi.fn(),
}))

vi.mock('../../../src/models/Model.js', () => ({
  default: modelMocks,
  SystemRoles: {
    Owner: 'owner',
    Contributor: 'contributor',
    Consumer: 'consumer',
    None: '',
  },
  EntryKind: {
    Model: 'model',
    DataCard: 'data-card',
    MirroredModel: 'mirrored-model',
    UntrustedModel: 'untrusted-model',
  },
}))

const releaseMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  distinct: vi.fn(),
  find: vi.fn(),
}))

vi.mock('../../../src/models/Release.js', () => ({
  default: releaseMocks,
}))

const reviewMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  find: vi.fn(),
}))

vi.mock('../../../src/models/Review.js', () => ({
  default: reviewMocks,
}))

const responseMocks = vi.hoisted(() => ({
  find: vi.fn(),
}))

vi.mock('../../../src/models/Response.js', () => ({
  default: responseMocks,
  Decision: {
    RequestChanges: 'request_changes',
    Approve: 'approve',
    Undo: 'undo',
  },
}))

const accessRequestMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  distinct: vi.fn(),
}))

vi.mock('../../../src/models/AccessRequest.js', () => ({
  default: accessRequestMocks,
}))

const serviceMocks = vi.hoisted(() => ({
  searchModels: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => serviceMocks)

const schemaMocks = vi.hoisted(() => ({
  searchSchemas: vi.fn(),
}))
vi.mock('../../../src/services/schema.js', () => schemaMocks)

const schemaModelMocks = vi.hoisted(() => ({
  find: vi.fn(),
  aggregate: vi.fn(),
}))

vi.mock('../../../src/models/Schema.js', () => ({
  default: schemaModelMocks,
}))

const reviewRoleMocks = vi.hoisted(() => ({
  find: vi.fn(),
}))

vi.mock('../../../src/models/ReviewRole.js', () => ({
  default: reviewRoleMocks,
}))

const authenticationMocks = vi.hoisted(() => ({
  hasRole: vi.fn(() => true),
}))

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: authenticationMocks,
}))

const mockFindQuery = (result: any) => ({
  select: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(result),
})

const mockUser = {
  dn: 'test-user',
} as any

modelMocks.aggregate.mockRejectedValueOnce(Object.assign(new Error('Invalid timezone'), { name: 'MongoServerError' }))
const mockQuery = (result: any) => ({
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(result),
})

const mockCursorQuery = (result: any[]) => {
  const asyncIterable = {
    async *[Symbol.asyncIterator]() {
      for (const item of result) {
        yield item
      }
    },
  }

  return {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    cursor: vi.fn().mockReturnValue(asyncIterable),
  }
}

const mockFindWithIdFilter = (allModels: any[]) =>
  vi.fn().mockImplementation((filter: any = {}) => {
    let filtered = allModels

    if (filter.id?.$in) {
      filtered = filtered.filter((model) => filter.id.$in.includes(model.id))
    }
    if (filter.id?.$nin) {
      filtered = filtered.filter((model) => !filter.id.$nin.includes(model.id))
    }

    return mockFindQuery(filtered)
  })

describe('connectors > metrics > simple > getUsageMetrics', async () => {
  let connector
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])
    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['b corp'])
  })

  test('calculateUsageMetrics returns global metrics', async () => {
    modelMocks.distinct.mockResolvedValue(['m1', 'm2'])
    schemaModelMocks.aggregate.mockResolvedValue([])

    modelMocks.aggregate.mockImplementation((pipeline: any[]) => {
      if (pipeline.some((stage) => stage.$unwind === '$collaborators')) {
        return Promise.resolve([{ count: 5 }])
      }

      if (pipeline.some((stage) => stage.$group?._id === '$state')) {
        return Promise.resolve([{ _id: 'active', count: 3 }])
      }

      return Promise.resolve([])
    })

    modelMocks.countDocuments.mockImplementation((filter: any = {}) => {
      if (filter.organisation === 'b corp') {
        return Promise.resolve(4)
      }
      if (filter.organisation === '') {
        return Promise.resolve(6)
      }
      if (filter.id?.$in) {
        return Promise.resolve(filter.id.$in.length)
      }
      return Promise.resolve(10)
    })

    releaseMocks.aggregate.mockResolvedValue([{ count: 2 }])
    releaseMocks.distinct.mockResolvedValue(['m1', 'm2', 'm3'])

    accessRequestMocks.aggregate.mockResolvedValue([{ count: 1 }])
    accessRequestMocks.distinct.mockResolvedValue(['m1', 'm2'])

    schemaMocks.searchSchemas.mockResolvedValue([{ id: 'schema1', name: 'Schema 1' }])

    const result = await connector.getUsageMetrics(mockUser)

    expect(result.global.entries).toBe(10)
    expect(result.global.users).toBe(5)
    expect(result.global.withReleases).toBe(3)
    expect(result.global.withAccessRequest).toBe(2)

    expect(result.byOrganisation).toHaveLength(2)

    const corp = result.byOrganisation.find((o) => o.organisation === 'b corp')
    const unset = result.byOrganisation.find((o) => o.organisation === 'unset')

    expect(corp?.entries).toBe(4)
    expect(unset?.entries).toBe(6)
  })

  test('returns zero counts when aggregates return empty', async () => {
    modelMocks.distinct.mockResolvedValueOnce([])
    schemaModelMocks.aggregate.mockResolvedValue([])

    modelMocks.aggregate.mockResolvedValue([])
    modelMocks.countDocuments.mockResolvedValue(0)

    releaseMocks.distinct.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([])
    serviceMocks.searchModels.mockResolvedValue({ models: [] })

    const result = await connector.getUsageMetrics(mockUser)

    expect(result.global.entries).toBe(0)
    expect(result.global.users).toBe(0)
    expect(result.global.withReleases).toBe(0)
    expect(result.global.withAccessRequest).toBe(0)
    expect(result.byOrganisation).toHaveLength(2)
  })

  test('schema breakdown returns correct counts', async () => {
    modelMocks.distinct.mockResolvedValue([])
    modelMocks.aggregate.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([
      { id: 'schema1', name: 'Schema 1' },
      { id: 'schema2', name: 'Schema 2' },
    ])

    schemaModelMocks.aggregate.mockResolvedValue([
      { schemaId: 'schema1', schemaName: 'Schema 1', count: 3 },
      { schemaId: 'schema2', schemaName: 'Schema 2', count: 0 },
    ])

    releaseMocks.distinct.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])
    modelMocks.countDocuments.mockResolvedValue(0)

    const result = await connector.getUsageMetrics(mockUser)

    expect(result.global.schemaBreakdown).toEqual([
      { schemaId: 'schema1', schemaName: 'Schema 1', count: 3 },
      { schemaId: 'schema2', schemaName: 'Schema 2', count: 0 },
      { schemaId: 'none', schemaName: 'None', count: 0 },
    ])
  })

  test('global metrics are computed independently from per-org metrics', async () => {
    schemaModelMocks.aggregate.mockResolvedValue([])
    modelMocks.aggregate.mockResolvedValue([])
    releaseMocks.distinct.mockResolvedValue([])
    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])
    schemaMocks.searchSchemas.mockResolvedValue([])

    modelMocks.countDocuments.mockImplementation((filter: any = {}) => {
      if (filter.organisation === 'b corp') {
        return Promise.resolve(3)
      }
      if (filter.organisation === '') {
        return Promise.resolve(3)
      }
      return Promise.resolve(7)
    })

    const result = await connector.getUsageMetrics(mockUser)

    expect(result.global.entries).toBe(7)

    const corp = result.byOrganisation.find((o: any) => o.organisation === 'b corp')
    const unset = result.byOrganisation.find((o: any) => o.organisation === 'unset')

    expect(corp?.entries).toBe(3)
    expect(unset?.entries).toBe(3)
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    const response = connector.getUsageMetrics(mockUser)

    await expect(response).rejects.toThrow('You do not have the required role.')
  })
})

describe('connectors > metrics > simple > getRoleComplianceMetrics', async () => {
  let connector
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['b corp'])
  })

  test('calculateComplianceMetrics returns correct global summary and entries', async () => {
    modelMocks.distinct.mockImplementation((field: string) => {
      if (field === 'organisation') {
        return Promise.resolve(['a corp'])
      }
      return Promise.resolve([])
    })

    schemaModelMocks.find.mockReturnValue(
      mockQuery([
        {
          id: 'schema1',
          reviewRoles: ['msro'],
        },
      ]),
    )

    reviewRoleMocks.find.mockReturnValue(
      mockQuery([
        { shortName: 'msro', name: 'MSRO', systemRole: 'msro' },
        { shortName: 'mtr', name: 'Model Technical Reviewer', systemRole: 'mtr' },
      ]),
    )

    modelMocks.find.mockReturnValue(
      mockCursorQuery([
        {
          id: 'model-1',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [{ entity: 'user1', roles: ['mtr', 'owner'] }],
        },
        {
          id: 'model-2',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
      ]),
    )

    const result = await connector.getRoleComplianceMetrics(mockUser)

    expect(result.global.entries).toHaveLength(2)

    expect(result.global.entries).toEqual(
      expect.arrayContaining([
        {
          entryId: 'model-1',
          missingRoles: [{ roleId: 'msro', roleName: 'MSRO' }],
          modelOwners: ['user1'],
        },
        {
          entryId: 'model-2',
          missingRoles: [{ roleId: 'msro', roleName: 'MSRO' }],
          modelOwners: [],
        },
      ]),
    )

    expect(result.global.summary).toEqual(expect.arrayContaining([{ roleId: 'msro', roleName: 'MSRO', count: 2 }]))
  })

  test('groups results by organisation correctly', async () => {
    modelMocks.distinct.mockResolvedValue(['a corp', 'b corp'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: ['msro'] }]))

    reviewRoleMocks.find.mockReturnValue(mockQuery([{ shortName: 'msro', name: 'MSRO', systemRole: 'msro' }]))

    modelMocks.find.mockImplementation((filter: any) => {
      const allModels = [
        {
          id: 'model-a corp',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
        {
          id: 'model-b corp',
          organisation: 'b corp',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
      ]

      const filtered = filter?.organisation
        ? allModels.filter((m) => m.organisation === filter.organisation)
        : allModels

      return mockCursorQuery(filtered)
    })

    const result = await connector.getRoleComplianceMetrics(mockUser)

    expect(result.byOrganisation).toHaveLength(2)

    const bCorp = result.byOrganisation.find((o) => o.organisation === 'b corp')
    const unset = result.byOrganisation.find((o) => o.organisation === 'unset')

    expect(bCorp?.entries).toHaveLength(1)
    expect(unset?.entries).toHaveLength(2)
  })

  test('unset compliance metrics only include entries with empty organisation', async () => {
    // Distinct organisations includes empty string
    modelMocks.distinct.mockResolvedValue(['', 'orgA'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: ['msro'] }]))

    reviewRoleMocks.find.mockReturnValue(mockQuery([{ shortName: 'msro', name: 'MSRO', systemRole: 'msro' }]))

    modelMocks.find.mockImplementation((filter: any) => {
      const allModels = [
        {
          id: 'unset-model',
          organisation: '',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
        {
          id: 'orgA-model',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
      ]

      const filtered =
        filter?.organisation !== undefined ? allModels.filter((m) => m.organisation === filter.organisation) : allModels

      return mockCursorQuery(filtered)
    })

    const result = await connector.getRoleComplianceMetrics(mockUser)

    const unset = result.byOrganisation.find((o) => o.organisation === 'unset')

    expect(unset).toBeDefined()
    expect(unset?.entries).toHaveLength(1)
    expect(unset?.entries[0].entryId).toBe('unset-model')
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    await expect(connector.getRoleComplianceMetrics(mockUser)).rejects.toThrow()
  })
})

describe('connectors > metrics > simple > getNoReleaseComplianceMetrics', async () => {
  let connector
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['a corp', 'b corp'])
  })

  test('groups results by organisation correctly', async () => {
    modelMocks.distinct.mockResolvedValue(['a corp', 'b corp'])

    modelMocks.aggregate.mockImplementation(() => {
      const allModels = [
        {
          id: 'orgB-model',
          organisation: 'b corp',
          owners: ['user:user'],
        },
      ]
      return allModels
    })

    const result = await connector.getNoReleasesMetrics(mockUser)

    expect(result.byOrganisation).toHaveLength(3)
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    await expect(connector.getNoReleasesMetrics(mockUser)).rejects.toThrow()
  })
})

describe('connectors > metrics > simple > getUnapprovedComplianceMetrics', async () => {
  let connector
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    // Default: no models, releases, reviews or responses.
    modelMocks.find.mockReturnValue(mockQuery([]))
    releaseMocks.find.mockReturnValue(mockQuery([]))
    reviewMocks.find.mockReturnValue(mockQuery([]))
    responseMocks.find.mockReturnValue(mockQuery([]))

    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['a corp'])
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    await expect(connector.getUnapprovedComplianceMetrics(mockUser)).rejects.toThrow(
      'You do not have the required role.',
    )
  })

  test('returns empty results when there are no models', async () => {
    modelMocks.find.mockReturnValue(mockQuery([]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(0)
    expect(result.global.summary.totalUnapprovedReleases).toBe(0)
    expect(result.global.entries).toEqual([])
  })

  test('returns empty results when models have no releases', async () => {
    modelMocks.find.mockReturnValue(mockQuery([{ id: 'model-1', collaborators: [] }]))
    releaseMocks.find.mockReturnValue(mockQuery([]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(0)
    expect(result.global.summary.totalUnapprovedReleases).toBe(0)
    expect(result.global.entries).toEqual([])
  })

  test('flags a release with no reviews at all as unapproved', async () => {
    modelMocks.find.mockReturnValue(
      mockQuery([{ id: 'model-1', collaborators: [{ entity: 'user:owner', roles: ['owner'] }] }]),
    )
    releaseMocks.find.mockReturnValue(mockQuery([{ modelId: 'model-1', semver: '1.0.0' }]))
    reviewMocks.find.mockReturnValue(mockQuery([]))
    responseMocks.find.mockReturnValue(mockQuery([]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(1)
    expect(result.global.summary.totalUnapprovedReleases).toBe(1)
    expect(result.global.entries).toEqual([
      {
        entryId: 'model-1',
        modelOwners: ['user:owner'],
        unapprovedReleases: ['1.0.0'],
      },
    ])
  })

  test('flags a release when a required review role has no approving response', async () => {
    modelMocks.find.mockReturnValue(
      mockQuery([{ id: 'model-1', collaborators: [{ entity: 'user:owner', roles: ['owner'] }] }]),
    )
    releaseMocks.find.mockReturnValue(mockQuery([{ modelId: 'model-1', semver: '1.0.0' }]))
    reviewMocks.find.mockReturnValue(
      mockQuery([
        { _id: 'review-msro', modelId: 'model-1', semver: '1.0.0', role: 'msro' },
        { _id: 'review-mtr', modelId: 'model-1', semver: '1.0.0', role: 'mtr' },
      ]),
    )
    // Only the msro role has approved.
    responseMocks.find.mockReturnValue(mockQuery([{ parentId: 'review-msro' }]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(1)
    expect(result.global.summary.totalUnapprovedReleases).toBe(1)
    expect(result.global.entries).toEqual([
      {
        entryId: 'model-1',
        modelOwners: ['user:owner'],
        unapprovedReleases: ['1.0.0'],
      },
    ])
  })

  test('does not flag a release when all required review roles have approved', async () => {
    modelMocks.find.mockReturnValue(
      mockQuery([{ id: 'model-1', collaborators: [{ entity: 'user:owner', roles: ['owner'] }] }]),
    )
    releaseMocks.find.mockReturnValue(mockQuery([{ modelId: 'model-1', semver: '1.0.0' }]))
    reviewMocks.find.mockReturnValue(
      mockQuery([
        { _id: 'review-msro', modelId: 'model-1', semver: '1.0.0', role: 'msro' },
        { _id: 'review-mtr', modelId: 'model-1', semver: '1.0.0', role: 'mtr' },
      ]),
    )
    // Both roles have approved.
    responseMocks.find.mockReturnValue(mockQuery([{ parentId: 'review-msro' }, { parentId: 'review-mtr' }]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(0)
    expect(result.global.summary.totalUnapprovedReleases).toBe(0)
    expect(result.global.entries).toEqual([])
  })

  test('reports each unapproved release for a model and counts them all', async () => {
    modelMocks.find.mockReturnValue(mockQuery([{ id: 'model-1', collaborators: [] }]))
    releaseMocks.find.mockReturnValue(
      mockQuery([
        { modelId: 'model-1', semver: '2.0.0' },
        { modelId: 'model-1', semver: '1.0.0' },
        { modelId: 'model-1', semver: '1.5.0' },
      ]),
    )
    reviewMocks.find.mockReturnValue(
      mockQuery([
        // 1.0.0 is fully approved
        { _id: 'review-1', modelId: 'model-1', semver: '1.0.0', role: 'msro' },
        // 1.5.0 has an outstanding review
        { _id: 'review-2', modelId: 'model-1', semver: '1.5.0', role: 'msro' },
      ]),
    )
    responseMocks.find.mockReturnValue(mockQuery([{ parentId: 'review-1' }]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(1)
    // 2.0.0 (no reviews) and 1.5.0 (outstanding) are unapproved, sorted.
    expect(result.global.summary.totalUnapprovedReleases).toBe(2)
    expect(result.global.entries).toEqual([
      {
        entryId: 'model-1',
        modelOwners: [],
        unapprovedReleases: ['1.5.0', '2.0.0'],
      },
    ])
  })

  test('groups unapproved releases by organisation', async () => {
    modelMocks.find.mockImplementation((filter: any) => {
      const allModels = [
        { id: 'model-a', organisation: 'a corp', collaborators: [] },
        { id: 'model-unset', organisation: '', collaborators: [] },
      ]
      const filtered =
        filter?.organisation !== undefined
          ? allModels.filter((model) => model.organisation === filter.organisation)
          : allModels
      return mockQuery(filtered)
    })

    releaseMocks.find.mockImplementation((filter: any) => {
      const allReleases = [
        { modelId: 'model-a', semver: '1.0.0' },
        { modelId: 'model-unset', semver: '1.0.0' },
      ]
      const filtered = filter?.modelId?.$in
        ? allReleases.filter((release) => filter.modelId.$in.includes(release.modelId))
        : allReleases
      return mockQuery(filtered)
    })

    reviewMocks.find.mockReturnValue(mockQuery([]))
    responseMocks.find.mockReturnValue(mockQuery([]))

    const result = await connector.getUnapprovedComplianceMetrics(mockUser)

    expect(result.byOrganisation).toHaveLength(2)

    const aCorp = result.byOrganisation.find((o) => o.organisation === 'a corp')
    const unset = result.byOrganisation.find((o) => o.organisation === 'unset')

    expect(aCorp?.modelsWithUnapprovedReleases).toBe(1)
    expect(aCorp?.entries.map((entry) => entry.entryId)).toEqual(['model-a'])

    expect(unset?.modelsWithUnapprovedReleases).toBe(1)
    expect(unset?.entries.map((entry) => entry.entryId)).toEqual(['model-unset'])

    // Global aggregates both.
    expect(result.global.summary.totalModelsWithUnapprovedReleases).toBe(2)
    expect(result.global.summary.totalUnapprovedReleases).toBe(2)
  })
})

describe('connectors > metrics > simple > calculateEntryVolume', async () => {
  let connector
  beforeEach(async () => {
    vi.clearAllMocks()
    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['b corp'])
  })

  test('calculateEntryVolume > basic aggregation', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([
        {
          _id: {
            periodStart: new Date('2026-01-01T00:00:00.000Z'),
            organisation: 'org-1',
          },
          count: 5,
        },
      ])

    modelMocks.distinct.mockResolvedValueOnce(['org-1'])

    const result = await connector.calculateEntryVolume(mockUser, 'day', '2026-01-01', '2026-01-03')

    expect(modelMocks.aggregate).toHaveBeenCalledTimes(2)
    expect(modelMocks.distinct).toHaveBeenCalledWith('organisation')

    expect(result.lastUpdated).toBeDefined()

    const { lastUpdated, ...rest } = result

    expect(lastUpdated).toEqual(expect.any(String))

    expect(rest).toEqual({
      interval: 'day',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-03T00:00:00.000Z',
      data: [
        {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-02T00:00:00.000Z',
          count: 5,
          organisations: {
            'org-1': 5,
            unset: 0,
          },
        },
        {
          startDate: '2026-01-02T00:00:00.000Z',
          endDate: '2026-01-03T00:00:00.000Z',
          count: 0,
          organisations: {
            'org-1': 0,
            unset: 0,
          },
        },
        {
          startDate: '2026-01-03T00:00:00.000Z',
          endDate: '2026-01-04T00:00:00.000Z',
          count: 0,
          organisations: {
            'org-1': 0,
            unset: 0,
          },
        },
      ],
    })
  })

  test('calculateEntryVolume > bad timezone', async () => {
    modelMocks.aggregate.mockRejectedValueOnce(
      Object.assign(new Error('Invalid timezone'), { name: 'MongoServerError' }),
    )

    await expect(
      connector.calculateEntryVolume(mockUser, 'week', '2026-01-01', '2026-02-01', 'notARealTimeZone'),
    ).rejects.toThrow(BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.'))
  })

  test('calculateEntryVolume > day interval stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const result = await connector.calculateEntryVolume(mockUser, 'day', '2026-01-01', '2026-01-03')

    expect(result.interval).toBe('day')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-01-02T00:00:00.000Z')
  })

  test('calculateEntryVolume > week interval stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-04T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const result = await connector.calculateEntryVolume(mockUser, 'week', '2026-01-04', '2026-01-18')

    expect(result.interval).toBe('week')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-01-11T00:00:00.000Z')
  })

  test('calculateEntryVolume > month interval stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const result = await connector.calculateEntryVolume(mockUser, 'month', '2026-01-01', '2026-03-01')

    expect(result.interval).toBe('month')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-02-01T00:00:00.000Z')
  })

  test('calculateEntryVolume > quarter interval stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const result = await connector.calculateEntryVolume(mockUser, 'quarter', '2026-01-01', '2026-07-01')

    expect(result.interval).toBe('quarter')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-04-01T00:00:00.000Z')
  })

  test('calculateEntryVolume > year interval stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const result = await connector.calculateEntryVolume(mockUser, 'year', '2026-01-01', '2028-01-01')

    expect(result.interval).toBe('year')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2027-01-01T00:00:00.000Z')
  })

  test('calculateEntryVolume > empty string organisation is counted as unset', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-04-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([
        {
          _id: {
            periodStart: new Date('2026-04-01T00:00:00.000Z'),
            organisation: 'unset',
          },
          count: 1,
        },
      ])

    // Simulate DB containing an empty string org
    modelMocks.distinct.mockResolvedValueOnce(['', 'Example Organisation'])

    const result = await connector.calculateEntryVolume(mockUser, 'month', '2026-04-01', '2026-04-28')

    expect(result.data[0]).toEqual({
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-05-01T00:00:00.000Z',
      count: 1,
      organisations: {
        'Example Organisation': 0,
        unset: 1,
      },
    })
  })

  test('calculateEntryVolume > month interval includes models created on last day', async () => {
    const start = new Date('2026-05-01T00:00:00.000Z')

    modelMocks.aggregate
      // aligned start
      .mockResolvedValueOnce([{ alignedStart: start }])
      // aggregation results
      .mockResolvedValueOnce([
        {
          _id: {
            periodStart: new Date('2026-05-01T00:00:00.000Z'),
            organisation: 'org-1',
          },
          count: 1,
        },
      ])

    modelMocks.distinct.mockResolvedValueOnce(['org-1'])

    const result = await connector.calculateEntryVolume(mockUser, 'month', '2026-05-01', '2026-05-31')

    expect(result.data[0]).toEqual({
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-06-01T00:00:00.000Z',
      count: 1,
      organisations: {
        'org-1': 1,
        unset: 0,
      },
    })
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    await expect(connector.calculateEntryVolume(mockUser, 'month', '2026-05-01', '2026-05-31')).rejects.toThrow(
      'You do not have the required role.',
    )
  })
})

describe('connectors > metrics > simple > calculateModelBreakdown', async () => {
  let connector

  beforeEach(async () => {
    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['b corp'])
  })

  test('returns mapped model breakdown results', async () => {
    modelMocks.find.mockReturnValue(
      mockFindQuery([
        {
          id: 'model-1',
          name: 'Model One',
          collaborators: [
            {
              entity: 'user:test',
              roles: ['owner'],
            },
          ],
        },
      ]),
    )

    const result = await connector.calculateModelBreakdown(mockUser, {} as any)

    expect(result).toEqual([
      {
        entryId: 'model-1',
        entryName: 'Model One',
        collaborators: [
          {
            entity: 'user:test',
            roles: ['owner'],
          },
        ],
      },
    ])

    expect(modelMocks.find).toHaveBeenCalledWith({})
  })

  test('queries empty organisation when organisation is none', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      organisation: 'unset',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      organisation: '',
    })
  })

  test('queries empty state when state is none', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      state: 'none',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      state: '',
    })
  })

  test('queries models without schema when schemaId is none', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      schemaId: 'none',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      'card.schemaId': { $exists: false },
    })
  })

  test('queries specific schema when schemaId is provided', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      schemaId: 'minimal-general-v10',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      'card.schemaId': 'minimal-general-v10',
    })
  })

  test('combines organisation, state and schema filters', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      organisation: 'Example Organisation',
      state: 'active',
      schemaId: 'minimal-general-v10',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      organisation: 'Example Organisation',
      state: 'active',
      'card.schemaId': 'minimal-general-v10',
    })
  })

  test('queries specific entry kind when kind is provided', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      kinds: ['model'],
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      kind: { $in: ['model'] },
    })
  })

  test('combines kind with organisation, state and schema filters', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      organisation: 'Example Organisation',
      state: 'active',
      schemaId: 'minimal-general-v10',
      kinds: ['model', 'data-card'],
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      organisation: 'Example Organisation',
      state: 'active',
      'card.schemaId': 'minimal-general-v10',
      kind: { $in: ['model', 'data-card'] },
    })
  })

  test('returns only entries that have a release when release filter is "with"', async () => {
    const allModels = [
      { id: 'model-1', name: 'Model One', collaborators: [] },
      { id: 'model-2', name: 'Model Two', collaborators: [] },
    ]

    modelMocks.find.mockImplementation(mockFindWithIdFilter(allModels))
    releaseMocks.distinct.mockResolvedValue(['model-1'])

    const result = await connector.calculateModelBreakdown(mockUser, { release: 'with' } as any)

    expect(result.map((entry) => entry.entryId)).toEqual(['model-1'])
  })

  test('returns only entries that do not have a release when release filter is "without"', async () => {
    const allModels = [
      { id: 'model-1', name: 'Model One', collaborators: [] },
      { id: 'model-2', name: 'Model Two', collaborators: [] },
    ]

    modelMocks.find.mockImplementation(mockFindWithIdFilter(allModels))
    releaseMocks.distinct.mockResolvedValue(['model-1'])

    const result = await connector.calculateModelBreakdown(mockUser, { release: 'without' } as any)

    expect(result.map((entry) => entry.entryId)).toEqual(['model-2'])
  })

  test('returns only entries that have an access request when accessRequest filter is "with"', async () => {
    const allModels = [
      { id: 'model-1', name: 'Model One', collaborators: [] },
      { id: 'model-2', name: 'Model Two', collaborators: [] },
    ]

    modelMocks.find.mockImplementation(mockFindWithIdFilter(allModels))
    accessRequestMocks.distinct.mockResolvedValue(['model-2'])

    const result = await connector.calculateModelBreakdown(mockUser, { accessRequest: 'with' } as any)

    expect(result.map((entry) => entry.entryId)).toEqual(['model-2'])
  })

  test('returns only entries that do not have an access request when accessRequest filter is "without"', async () => {
    const allModels = [
      { id: 'model-1', name: 'Model One', collaborators: [] },
      { id: 'model-2', name: 'Model Two', collaborators: [] },
    ]

    modelMocks.find.mockImplementation(mockFindWithIdFilter(allModels))
    accessRequestMocks.distinct.mockResolvedValue(['model-2'])

    const result = await connector.calculateModelBreakdown(mockUser, { accessRequest: 'without' } as any)

    expect(result.map((entry) => entry.entryId)).toEqual(['model-1'])
  })

  test('filters by startMonth only', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      startMonth: '2026-01',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      createdAt: { $gte: new Date('2026-01-01T00:00:00.000Z') },
    })
  })

  test('filters by endMonth only', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      endMonth: '2026-01',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      createdAt: { $lt: new Date('2026-02-01T00:00:00.000Z') },
    })
  })

  test('filters by both startMonth and endMonth', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      startMonth: '2026-01',
      endMonth: '2026-03',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      createdAt: {
        $gte: new Date('2026-01-01T00:00:00.000Z'),
        $lt: new Date('2026-04-01T00:00:00.000Z'),
      },
    })
  })

  test('combines startMonth/endMonth with organisation, state and schema filters', async () => {
    modelMocks.find.mockReturnValue(mockFindQuery([]))

    await connector.calculateModelBreakdown(mockUser, {
      organisation: 'Example Organisation',
      state: 'active',
      schemaId: 'minimal-general-v10',
      startMonth: '2026-01',
      endMonth: '2026-02',
    } as any)

    expect(modelMocks.find).toHaveBeenCalledWith({
      organisation: 'Example Organisation',
      state: 'active',
      'card.schemaId': 'minimal-general-v10',
      createdAt: {
        $gte: new Date('2026-01-01T00:00:00.000Z'),
        $lt: new Date('2026-03-01T00:00:00.000Z'),
      },
    })
  })

  test('throws when startMonth is after endMonth', async () => {
    await expect(
      connector.calculateModelBreakdown(mockUser, {
        startMonth: '2026-03',
        endMonth: '2026-01',
      } as any),
    ).rejects.toThrow(BadReq('startMonth must be before or equal to endMonth'))
  })
})

describe('connectors > metrics > simple > getLifecycleComplianceMetrics', async () => {
  let connector
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const { BaseMetricsConnector } = await loadConnector()
    connector = new BaseMetricsConnector(['a corp', 'b corp'])
  })

  test('groups results by organisation correctly', async () => {
    reviewMocks.aggregate.mockImplementation(() => {
      const allModels = [
        {
          entryId: 'orgA-model',
          dueDate: new Date().toISOString(),
        },
        {
          entryId: 'orgB-model',
          dueDate: new Date().toISOString(),
        },
        {
          entryId: 'orgC-model',
          dueDate: new Date().toISOString(),
        },
      ]
      return allModels
    })

    const result = await connector.getLifecycleComplianceMetrics(mockUser, 2)
    expect(result.byOrganisation).toHaveLength(3)
  })

  test('throws Forbidden if user is not admin', async () => {
    authenticationMocks.hasRole.mockResolvedValue(false)

    await expect(connector.getLifecycleComplianceMetrics(mockUser, 2)).rejects.toThrow()
  })
})
