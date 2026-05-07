import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getModelVolumeSchema } from '../../../src/routes/v3/metrics/getModelVolume.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockMetricsConnector = vi.hoisted(() => ({
  calculateModelVolume: vi.fn(() => ({
    interval: 'day',
    startDate: 'string',
    endDate: 'string',
    data: [],
  })),
}))

vi.mock('../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getModelVolume', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getModelVolumeSchema)

    const res = await testGet(`/api/v3/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getModelVolumeSchema)

    const res = await testGet(`/api/v3/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewMetric).toBeCalled()
    expect(audit.onViewMetric.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
