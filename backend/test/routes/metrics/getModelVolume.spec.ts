import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getModelVolumeSchema } from '../../../src/routes/v2/metrics/getModelVolume.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockAuthentication = vi.hoisted(() => ({
  hasRole: vi.fn(async () => true),
  authenticationMiddleware: vi.fn(() => [
    {
      path: '/',
      middleware: (req: any, _res: any, next: any) => {
        req.user = { dn: 'testUser' }
        next()
      },
    },
  ]),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({
  default: mockAuthentication,
}))

const mockReviewService = vi.hoisted(() => ({
  calculateModelVolume: vi.fn(() => ({})),
}))
vi.mock('../../../src/services/metrics.js', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    default: mockReviewService,
  }
})

describe('routes > metrics > getModelVolume', () => {
  test('200 > ok', async () => {
    vi.setSystemTime(new Date(0))
    const fixture = createFixture(getModelVolumeSchema)
    const res = await testGet(`/api/v2/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('403 > admin required', async () => {
    vi.setSystemTime(new Date(0))
    mockAuthentication.hasRole.mockResolvedValueOnce(false)
    const fixture = createFixture(getModelVolumeSchema)
    const res = await testGet(`/api/v2/metrics/modelVolume?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(403)
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
