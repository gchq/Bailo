import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getImageSchema } from '../../../../src/routes/v2/model/images/getImage.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/registry.js', () => ({
  getModelImageWithScanResults: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > images > getImage', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getImageSchema)
    const res = await testGet(
      `/api/v2/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}`,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getImageSchema)
    const res = await testGet(
      `/api/v2/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}`,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onViewModelImage).toBeCalled()
    expect(audit.onViewModelImage.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onViewModelImage.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
