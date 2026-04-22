import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getModelVolumeSchema } from '../../../src/routes/v2/metrics/getModelVolume.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockMetricsService = vi.hoisted(() => ({
  calculateModelVolume: vi.fn(() => ({
    startDate: 'string',
    endDate: 'string',
    dataPoints: [],
  })),
}))

vi.mock('../../../src/services/metrics.js', () => mockMetricsService)

describe('routes > metrics > getModelVolume', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getModelVolumeSchema)

    const res = await testGet(`/api/v2/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getModelVolumeSchema)

    const res = await testGet(`/api/v2/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewMetric).toBeCalled()
    expect(audit.onViewMetric.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
