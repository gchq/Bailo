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

describe('connectors > metrics > simple', () => {
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
      if (pipeline.some((stage) => stage.$group?._id === '$schemaId')) {
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

  test('calculatePolicyMetrics returns correct global summary and models', async () => {
    modelMocks.distinct.mockImplementation((field: string) => {
      if (field === 'organisation') {
        return Promise.resolve(['west'])
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
          organisation: 'west',
          card: { schemaId: 'schema1' },
          collaborators: [{ entity: 'user1', roles: ['mtr', 'md'] }],
        },
        {
          id: 'model-2',
          organisation: 'west',
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
    modelMocks.distinct.mockResolvedValue(['west'])

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
          organisation: 'west',
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
    modelMocks.distinct.mockResolvedValue(['west', 'east'])

    schemaModelMocks.find.mockReturnValue(mockQuery([{ id: 'schema1', reviewRoles: [] }]))

    reviewRoleMocks.find.mockReturnValue(mockQuery([{ shortName: 'msro', name: 'MSRO', systemRole: 'msro' }]))

    modelMocks.find.mockImplementation((filter: any) => {
      const allModels = [
        {
          id: 'model-west',
          organisation: 'west',
          card: { schemaId: 'schema1' },
          collaborators: [],
        },
        {
          id: 'model-east',
          organisation: 'east',
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

    const west = result.byOrganisation.find((o) => o.organisation === 'west')
    const east = result.byOrganisation.find((o) => o.organisation === 'east')

    expect(west?.models).toHaveLength(1)
    expect(east?.models).toHaveLength(1)
  })
  test('calculateModelVolume > basic aggregation', async () => {
    modelMocks.aggregate.mockResolvedValueOnce([
      {
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-01-02T00:00:00.000Z'),
        count: 5,
      },
    ])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('day', '2026-01-01', '2026-01-10')

    expect(modelMocks.aggregate).toHaveBeenCalledOnce()
    expect(modelMocks.aggregate.mock.calls).toMatchSnapshot()

    expect(result).toEqual({
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-10T00:00:00.000Z',
      dataPoints: [
        {
          periodStart: '2026-01-01T00:00:00.000Z',
          periodEnd: '2026-01-02T00:00:00.000Z',
          count: 5,
        },
      ],
    })
  })

  test('calculateModelVolume > with organisation filter', async () => {
    modelMocks.aggregate.mockResolvedValueOnce([])

    const connector = new SimpleMetricsConnector()

    await connector.calculateModelVolume('week', '2026-01-01', '2026-02-01', 'UTC', 'org-1')

    expect(modelMocks.aggregate).toHaveBeenCalledOnce()
    expect(modelMocks.aggregate.mock.calls).toMatchSnapshot()
  })

  test('calculateModelVolume > multiple results mapped correctly', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'))

    modelMocks.aggregate.mockResolvedValueOnce([
      {
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-02-01T00:00:00.000Z'),
        count: 10,
      },
      {
        periodStart: new Date('2026-02-01T00:00:00.000Z'),
        periodEnd: new Date('2026-03-01T00:00:00.000Z'),
        count: 7,
      },
    ])

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateModelVolume('month')

    expect(result).toEqual({
      startDate: '1970-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
      dataPoints: [
        {
          periodStart: '2026-01-01T00:00:00.000Z',
          periodEnd: '2026-02-01T00:00:00.000Z',
          count: 10,
        },
        {
          periodStart: '2026-02-01T00:00:00.000Z',
          periodEnd: '2026-03-01T00:00:00.000Z',
          count: 7,
        },
      ],
    })

    vi.useRealTimers()
  })

  test('calculateModelVolume > bad timezone', async () => {
    modelMocks.aggregate.mockRejectedValueOnce(new Error('bad timezone'))

    const connector = new SimpleMetricsConnector()

    const result = connector.calculateModelVolume('week', '2026-01-01', '2026-02-01', 'notARealTimeZone')

    await expect(result).rejects.toThrowError(BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.'))
  })
})
