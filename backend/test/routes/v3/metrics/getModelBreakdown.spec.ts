import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockMetricsConnector = vi.hoisted(() => ({
  calculateModelBreakdown: vi.fn(() => [
    {
      entryId: 'print-ocr-model-g9yuo2',
      entryName: 'Print OCR model',
      collaborators: [
        {
          entity: 'user:user',
          roles: ['owner'],
        },
      ],
    },
  ]),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getModelBreakdown', () => {
  test('200 > ok', async () => {
    const queryParams = {
      organisation: 'All',
      state: 'Development',
    }
    const res = await testGet(`/api/v3/metrics/breakdown?${queryParams}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
