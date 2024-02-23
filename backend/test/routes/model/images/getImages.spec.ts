import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getImagesSchema } from '../../../../src/routes/v2/model/images/getImages.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/v2/registry.js', () => ({
  listModelImages: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > images > getImages', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getImagesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/images`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getImagesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/images`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewModelImages).toBeCalled()
    expect(audit.onViewModelImages.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onViewModelImages.mock.calls.at(0).at(2)).toMatchSnapshot()
  })
})
