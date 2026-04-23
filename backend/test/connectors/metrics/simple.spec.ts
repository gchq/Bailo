import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SimpleMetricsConnector } from '../../../src/connectors/metrics/simple.js'
import { BadReq } from '../../../src/utils/error.js'

vi.mock('../../../src/models/Model.js')
vi.mock('../../../src/models/Release.js')
vi.mock('../../../src/models/AccessRequest.js')
vi.mock('../../../src/services/model.js')
vi.mock('../../../src/services/schema.js')
vi.mock('../../../src/models/Schema.js')
vi.mock('../../../src/models/ReviewRole.js')

const modelMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  distinct: vi.fn(),
  find: vi.fn(),
}))
vi.mock('../../../src/models/Model.js', () => ({
  default: modelMocks,
}))

const releaseMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  distinct: vi.fn(),
}))
vi.mock('../../../src/models/Release.js', () => ({
  default: releaseMocks,
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

const mockQuery = (result: any) => ({
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(result),
})

describe('connectors > metrics > simple > calculateOverviewMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calculateOverviewMetrics returns global metrics', async () => {
    modelMocks.distinct
      .mockResolvedValueOnce(['org1'])
      .mockResolvedValueOnce(['m1', 'm2'])
      .mockResolvedValueOnce(['m1', 'm2'])

    modelMocks.aggregate.mockImplementation((pipeline: any[]) => {
      if (pipeline.some((stage) => stage.$unwind === '$collaborators')) {
        return Promise.resolve([{ count: 5 }])
      }

      if (pipeline.some((stage) => stage.$group?._id === '$state')) {
        return Promise.resolve([{ _id: 'active', count: 3 }])
      }

      if (pipeline.some((stage) => stage.$group?._id === '$schemaId')) {
        return Promise.resolve([{ _id: 'schema1', count: 2 }])
      }

      return Promise.resolve([])
    })

    modelMocks.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(4)

    releaseMocks.distinct.mockResolvedValueOnce(['m1', 'm2', 'm3', 'm4', 'm5', 'm6'])

    releaseMocks.aggregate.mockResolvedValueOnce([{ count: 2 }])

    accessRequestMocks.distinct.mockResolvedValueOnce(['a1', 'a2', 'a3'])
    accessRequestMocks.aggregate.mockResolvedValueOnce([{ count: 1 }])

    schemaMocks.searchSchemas.mockResolvedValue([{ id: 'schema1', name: 'Schema 1' }])

    serviceMocks.searchModels.mockResolvedValueOnce({ models: [{}, {}] }).mockResolvedValueOnce({ models: [{}] })

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics()

    expect(result.global.models).toBe(10)
    expect(result.global.users).toBe(5)
    expect(result.global.withReleases).toBe(6)
    expect(result.global.withAccessRequest).toBe(3)

    expect(result.byOrganisation).toHaveLength(1)
    expect(result.byOrganisation[0].organisation).toBe('org1')
    expect(result.byOrganisation[0].models).toBe(4)
  })

  test('returns zero counts when aggregates return empty', async () => {
    modelMocks.distinct.mockResolvedValueOnce([])

    modelMocks.aggregate.mockResolvedValue([])
    modelMocks.countDocuments.mockResolvedValue(0)

    releaseMocks.distinct.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([])
    serviceMocks.searchModels.mockResolvedValue({ models: [] })

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics()

    expect(result.global.models).toBe(0)
    expect(result.global.users).toBe(0)
    expect(result.global.withReleases).toBe(0)
    expect(result.global.withAccessRequest).toBe(0)
    expect(result.byOrganisation).toEqual([])
  })

  test('schema breakdown returns correct counts', async () => {
    modelMocks.distinct.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([
      { id: 'schema1', name: 'Schema 1' },
      { id: 'schema2', name: 'Schema 2' },
    ])

    modelMocks.aggregate.mockImplementation((pipeline: any[]) => {
      if (pipeline.some((stage) => stage.$group?._id === '$card.schemaId')) {
        return Promise.resolve([{ _id: 'schema1', count: 3 }])
      }
      return Promise.resolve([])
    })

    releaseMocks.distinct.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])
    modelMocks.countDocuments.mockResolvedValue(0)

    const connector = new SimpleMetricsConnector()
    const result = await connector.calculateOverviewMetrics()

    expect(result.global.schemaBreakdown).toEqual([
      { schemaId: 'schema1', schemaName: 'Schema 1', count: 3 },
      { schemaId: 'schema2', schemaName: 'Schema 2', count: 0 },
    ])
  })
  test('global model count equals sum of organisation + unset counts', async () => {
    // Distinct organisations returned from DB
    modelMocks.distinct.mockResolvedValueOnce(['', 'b corp', 'c corp'])

    // Global call
    modelMocks.countDocuments
      .mockResolvedValueOnce(6) // global
      .mockResolvedValueOnce(2) // unset
      .mockResolvedValueOnce(3) // b corp
      .mockResolvedValueOnce(1) // c corp

    // Minimal mocks for other aggregations
    modelMocks.aggregate.mockResolvedValue([])
    releaseMocks.distinct.mockResolvedValue([])

    // aggregate called once per organisation (3 orgs here)
    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics()

    const sumOfOrgs = result.byOrganisation.reduce((sum, org) => sum + org.models, 0)

    expect(result.global.models).toBe(6)
    expect(sumOfOrgs).toBe(result.global.models)
  })
  test('global model count equals sum of organisations when no unset exists', async () => {
    modelMocks.distinct.mockResolvedValueOnce(['b corp', 'c corp'])

    modelMocks.countDocuments
      .mockResolvedValueOnce(4) // global
      .mockResolvedValueOnce(3) // b corp
      .mockResolvedValueOnce(1) // c corp

    modelMocks.aggregate.mockResolvedValue([])
    releaseMocks.distinct.mockResolvedValue([])
    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.distinct.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])
    schemaMocks.searchSchemas.mockResolvedValue([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics()

    const sumOfOrgs = result.byOrganisation.reduce((sum, org) => sum + org.models, 0)

    expect(result.global.models).toBe(4)
    expect(sumOfOrgs).toBe(result.global.models)
  })
})

describe('connectors > metrics > simple > calculatePolicyMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calculatePolicyMetrics returns correct global summary and models', async () => {
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
          reviewRoles: ['md'],
        },
      ]),
    )

    reviewRoleMocks.find.mockReturnValue(
      mockQuery([
        { shortName: 'msro', name: 'MSRO', systemRole: 'msro' },
        { shortName: 'mtr', name: 'Model Technical Reviewer', systemRole: 'mtr' },
        { shortName: 'md', name: 'Model Developer', systemRole: null },
      ]),
    )

    modelMocks.find.mockReturnValue(
      mockQuery([
        {
          id: 'model-1',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [{ entity: 'user1', roles: ['mtr', 'md'] }],
        },
        {
          id: 'model-2',
          organisation: 'a corp',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
      ]),
    )

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculatePolicyMetrics()

    expect(result.global.models).toHaveLength(2)

    expect(result.global.models).toEqual(
      expect.arrayContaining([
        {
          modelId: 'model-1',
          missingRoles: [{ roleId: 'msro', roleName: 'MSRO' }],
        },
        {
          modelId: 'model-2',
          missingRoles: [
            { roleId: 'msro', roleName: 'MSRO' },
            { roleId: 'mtr', roleName: 'Model Technical Reviewer' },
            { roleId: 'md', roleName: 'Model Developer' },
          ],
        },
      ]),
    )

    expect(result.global.summary).toEqual(
      expect.arrayContaining([
        { roleId: 'msro', roleName: 'MSRO', count: 2 },
        { roleId: 'mtr', roleName: 'Model Technical Reviewer', count: 1 },
        { roleId: 'md', roleName: 'Model Developer', count: 1 },
      ]),
    )
  })
  test('model without card only checks default roles', async () => {
    modelMocks.distinct.mockResolvedValue(['a corp'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: ['md'] }]))

    reviewRoleMocks.find.mockReturnValue(
      mockQuery([
        { shortName: 'msro', name: 'MSRO', systemRole: 'msro' },
        { shortName: 'mtr', name: 'Model Technical Reviewer', systemRole: 'mtr' },
        { shortName: 'md', name: 'Model Developer', systemRole: null },
      ]),
    )

    modelMocks.find.mockReturnValue(
      mockQuery([
        {
          id: 'model-no-card',
          organisation: 'a corp',
          card: undefined,
          collaborators: [],
        },
      ]),
    )

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculatePolicyMetrics()

    expect(result.global.models[0].missingRoles).toEqual([
      { roleId: 'msro', roleName: 'MSRO' },
      { roleId: 'mtr', roleName: 'Model Technical Reviewer' },
    ])

    expect(result.global.summary).toEqual(
      expect.arrayContaining([{ roleId: 'md', roleName: 'Model Developer', count: 0 }]),
    )
  })
  test('groups results by organisation correctly', async () => {
    modelMocks.distinct.mockResolvedValue(['a corp', 'b corp'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: [] }]))

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

      return mockQuery(filtered)
    })

    const connector = new SimpleMetricsConnector()
    const result = await connector.calculatePolicyMetrics()

    expect(result.byOrganisation).toHaveLength(2)

    const aCorp = result.byOrganisation.find((o) => o.organisation === 'a corp')
    const bCorp = result.byOrganisation.find((o) => o.organisation === 'b corp')

    expect(aCorp?.models).toHaveLength(1)
    expect(bCorp?.models).toHaveLength(1)
  })
  test('unset policy metrics only include models with empty organisation', async () => {
    // Distinct organisations includes empty string
    modelMocks.distinct.mockResolvedValue(['', 'orgA'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: [] }]))

    reviewRoleMocks.find.mockReturnValue(mockQuery([{ shortName: 'msro', name: 'MSRO', systemRole: 'msro' }]))

    modelMocks.find.mockImplementation((filter: any) => {
      const allModels = [
        { id: 'unset-model', organisation: '', card: {}, collaborators: [] },
        { id: 'orgA-model', organisation: 'orgA', card: {}, collaborators: [] },
      ]

      const filtered =
        filter?.organisation !== undefined ? allModels.filter((m) => m.organisation === filter.organisation) : allModels

      return mockQuery(filtered)
    })

    const connector = new SimpleMetricsConnector()
    const result = await connector.calculatePolicyMetrics()

    const unset = result.byOrganisation.find((o) => o.organisation === 'unset')

    expect(unset).toBeDefined()
    expect(unset?.models).toHaveLength(1)
    expect(unset?.models[0].modelId).toBe('unset-model')
  })
})

describe('connectors > metrics > simple > calculateModelVolue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calculateModelVolume > basic aggregation', async () => {
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

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('day', '2026-01-01', '2026-01-03')

    expect(modelMocks.aggregate).toHaveBeenCalledTimes(2)
    expect(modelMocks.distinct).toHaveBeenCalledWith('organisation')

    expect(result).toEqual({
      bucket: 'day',
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

  test('calculateModelVolume > bad timezone', async () => {
    modelMocks.aggregate.mockRejectedValueOnce(new Error('Time zone not recognised'))

    const connector = new SimpleMetricsConnector()

    await expect(
      connector.calculateModelVolume('week', '2026-01-01', '2026-02-01', 'notARealTimeZone'),
    ).rejects.toThrowError(BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.'))
  })

  test('calculateModelVolume > day bucket stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('day', '2026-01-01', '2026-01-03')

    expect(result.bucket).toBe('day')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-01-02T00:00:00.000Z')
  })

  test('calculateModelVolume > week bucket stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-04T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('week', '2026-01-04', '2026-01-18')

    expect(result.bucket).toBe('week')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-01-11T00:00:00.000Z')
  })

  test('calculateModelVolume > month bucket stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('month', '2026-01-01', '2026-03-01')

    expect(result.bucket).toBe('month')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-02-01T00:00:00.000Z')
  })

  test('calculateModelVolume > quarter bucket stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('quarter', '2026-01-01', '2026-07-01')

    expect(result.bucket).toBe('quarter')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2026-04-01T00:00:00.000Z')
  })

  test('calculateModelVolume > year bucket stepping', async () => {
    modelMocks.aggregate
      .mockResolvedValueOnce([{ alignedStart: new Date('2026-01-01T00:00:00.000Z') }])
      .mockResolvedValueOnce([])

    modelMocks.distinct.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('year', '2026-01-01', '2028-01-01')

    expect(result.bucket).toBe('year')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].endDate).toBe('2027-01-01T00:00:00.000Z')
  })

  test('calculateModelVolume > empty string organisation is counted as unset', async () => {
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

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('month', '2026-04-01', '2026-04-28')

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
})
