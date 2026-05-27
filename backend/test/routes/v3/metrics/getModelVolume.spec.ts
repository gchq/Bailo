import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getEntryVolumeSchema } from '../../../../src/routes/v3/metrics/getEntryVolume.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockMetricsConnector = vi.hoisted(() => ({
  calculateEntryVolume: vi.fn(() => ({
    interval: 'day',
    startDate: 'string',
    endDate: 'string',
    data: [],
  })),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getEntryVolume', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getEntryVolumeSchema)

    const res = await testGet(`/api/v3/metrics/entryVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getEntryVolumeSchema)

    const res = await testGet(`/api/v3/metrics/entryVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewMetric).toHaveBeenCalled()
    expect(audit.onViewMetric.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
