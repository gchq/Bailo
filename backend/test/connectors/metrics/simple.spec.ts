import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SimpleMetricsConnector } from '../../../src/connectors/metrics/simple.js'

vi.mock('../../../src/models/Model.js')
vi.mock('../../../src/models/Release.js')
vi.mock('../../../src/models/AccessRequest.js')
vi.mock('../../../src/services/model.js')
vi.mock('../../../src/services/schema.js')

const modelMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  distinct: vi.fn(),
}))
vi.mock('../../../src/models/Model.js', () => ({
  default: modelMocks,
}))

const releaseMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
}))
vi.mock('../../../src/models/Release.js', () => ({
  default: releaseMocks,
}))

const accessRequestMocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
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

describe('connectors > metrics > simple', () => {
  const user = { dn: 'user' } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calculateOverviewMetrics returns global metrics', async () => {
    modelMocks.distinct.mockResolvedValueOnce(['org1'])

    modelMocks.aggregate
      .mockResolvedValueOnce([{ count: 5 }]) // users
      .mockResolvedValueOnce([{ _id: 'active', count: 3 }]) // state global
      .mockResolvedValueOnce([{ _id: 'active', count: 2 }]) // state org

    modelMocks.countDocuments
      .mockResolvedValueOnce(10) // global models
      .mockResolvedValueOnce(4) // org models

    releaseMocks.aggregate.mockResolvedValueOnce([{ count: 6 }]).mockResolvedValueOnce([{ count: 2 }])

    accessRequestMocks.aggregate.mockResolvedValueOnce([{ count: 3 }]).mockResolvedValueOnce([{ count: 1 }])

    schemaMocks.searchSchemas.mockResolvedValue([{ id: 'schema1', name: 'Schema 1' }])

    serviceMocks.searchModels
      .mockResolvedValueOnce({ models: [{}, {}] }) // global
      .mockResolvedValueOnce({ models: [{}] }) // org

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics(user)

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

    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([])
    serviceMocks.searchModels.mockResolvedValue({ models: [] })

    const connector = new SimpleMetricsConnector()

    const result = await connector.calculateOverviewMetrics(user)

    expect(result.global.models).toBe(0)
    expect(result.global.users).toBe(0)
    expect(result.global.withReleases).toBe(0)
    expect(result.global.withAccessRequest).toBe(0)
    expect(result.byOrganisation).toEqual([])
  })

  test('calls searchModels for each schema', async () => {
    modelMocks.distinct.mockResolvedValueOnce([])

    modelMocks.aggregate.mockResolvedValue([])
    modelMocks.countDocuments.mockResolvedValue(0)

    releaseMocks.aggregate.mockResolvedValue([])
    accessRequestMocks.aggregate.mockResolvedValue([])

    schemaMocks.searchSchemas.mockResolvedValue([
      { id: 'schema1', name: 'Schema 1' },
      { id: 'schema2', name: 'Schema 2' },
    ])

    serviceMocks.searchModels.mockResolvedValue({ models: [] })

    const connector = new SimpleMetricsConnector()

    await connector.calculateOverviewMetrics(user)

    expect(serviceMocks.searchModels).toHaveBeenCalledTimes(2)
  })
})
