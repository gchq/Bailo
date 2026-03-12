import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getArtefactScanningInfoSchema } from '../../../src/routes/v2/artefactScanning/getArtefactScanningInfo.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const scannersMocks = vi.hoisted(() => ({
  default: { scannersInfo: vi.fn() },
}))
vi.mock('../../../src/connectors/artefactScanning/index.js', () => scannersMocks)

describe('routes > artefactscanning > getArtefactScanningInfo', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getArtefactScanningInfoSchema)
    const res = await testGet('/api/v2/filescanning/info', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
    expect(scannersMocks.default.scannersInfo).toBeCalled()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getArtefactScanningInfoSchema)
    const res = await testGet('/api/v2/filescanning/info', fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewScanners).toBeCalled()
    expect(audit.onViewScanners.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
