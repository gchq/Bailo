import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockAuth = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => [
    {
      path: '/',
      middleware: (req: any, _res: any, next: any) => {
        req.user = { dn: 'test-user' }
        next()
      },
    },
  ]),
  hasRole: vi.fn(),
}))

vi.mock('../../../../src/connectors/authentication/index.js', () => ({
  default: mockAuth,
}))

const mockMetricsConnector = vi.hoisted(() => ({
  getModelBreakdown: vi.fn(),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getModelBreakdown', () => {
  test('200 > returns breakdown when user is Admin', async () => {
    mockMetricsConnector.getModelBreakdown.mockResolvedValue([
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
    ])

    const res = await testGet('/api/v3/metrics/breakdown')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([
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
    ])

    expect(mockMetricsConnector.getModelBreakdown).toHaveBeenCalled()
    expect(audit.onViewMetric).toHaveBeenCalled()
  })
})
