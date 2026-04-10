import { describe, expect, test } from 'vitest'

import { calculateModelVolume } from '../../src/services/metrics.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const ModelModelMock = getTypedModelMock('ModelModel')

describe('services > metrics', () => {
  test('calculateModelVolume > basic aggregation', async () => {
    ModelModelMock.aggregate.mockResolvedValueOnce([
      {
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-01-02T00:00:00.000Z'),
        count: 5,
      },
    ])

    const result = await calculateModelVolume('day', '2026-01-01', '2026-01-10')

    expect(ModelModelMock.aggregate).toHaveBeenCalledOnce()
    expect(ModelModelMock.aggregate.mock.calls).toMatchSnapshot()

    expect(result).toEqual([
      {
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-01-02T00:00:00.000Z',
        count: 5,
      },
    ])
  })

  test('calculateModelVolume > with organisation filter', async () => {
    ModelModelMock.aggregate.mockResolvedValueOnce([])

    await calculateModelVolume('week', '2026-01-01', '2026-02-01', 'UTC', 'org-1')

    expect(ModelModelMock.aggregate).toHaveBeenCalledOnce()
    expect(ModelModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('calculateModelVolume > multiple results mapped correctly', async () => {
    ModelModelMock.aggregate.mockResolvedValueOnce([
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

    const result = await calculateModelVolume('month', '2026-01-01', '2026-03-01')

    expect(result).toEqual([
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
    ])
  })
})
