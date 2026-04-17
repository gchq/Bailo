import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { registryEventsSchema } from '../../../src/routes/internal/registry/events.js'
import { putImageScanSchema } from '../../../src/routes/v2/artefactScanning/putImageScan.js'
import { createFixture, testPost, testPut } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

vi.mock('../../../src/services/scan.js', () => ({
  rerunImageScan: vi.fn(),
  rerunImageScanNoAuth: vi.fn(),
}))

vi.mock('../../../src/services/model.js', () => ({
  getModelByIdNoAuth: vi.fn(),
}))

describe('routes', () => {
  describe('artefactscanning > putImageScan', () => {
    test('200 > ok', async () => {
      const fixture = createFixture(putImageScanSchema)
      const res = await testPut(
        `/api/v2/filescanning/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}/scan`,
        fixture,
      )

      expect(res.statusCode).toBe(200)
      expect(res.body).matchSnapshot()
    })

    test('audit > expected call', async () => {
      const fixture = createFixture(putImageScanSchema)
      const res = await testPut(
        `/api/v2/filescanning/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}/scan`,
        fixture,
      )

      expect(res.statusCode).toBe(200)
      expect(audit.onUpdateImage).toBeCalled()
      expect(audit.onUpdateImage.mock.calls.at(0)?.at(1)).toMatchSnapshot()
      expect(audit.onUpdateImage.mock.calls.at(0)?.at(2)).toMatchSnapshot()
    })
  })

  describe('internal > registry > events', () => {
    // cannot actually test what the endpoint does as it immediately returns
    test('200 > ok', async () => {
      const fixture = createFixture(registryEventsSchema)
      const res = await testPost(`/internal/registry/events`, fixture)

      expect(res.statusCode).toBe(200)
      expect(res.body).matchSnapshot()
    })
  })
})
