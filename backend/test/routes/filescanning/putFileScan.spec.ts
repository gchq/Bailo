import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { putArtefactScanSchema } from '../../../src/routes/v2/artefactScanning/putArtefactScan.js'
import { createFixture, testPut } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

vi.mock('../../../src/services/scan.js', () => ({
  rerunArtefactScan: vi.fn(),
}))

describe('routes > filescanning > putFileScan', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putArtefactScanSchema)
    const res = await testPut(
      `/api/v2/filescanning/model/${fixture.params.modelId}/file/$${fixture.params.fileId}/scan`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putArtefactScanSchema)
    const res = await testPut(
      `/api/v2/filescanning/model/${fixture.params.modelId}/file/$${fixture.params.fileId}/scan`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateFile).toBeCalled()
    expect(audit.onUpdateFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onUpdateFile.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
