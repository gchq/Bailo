import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { deleteImageSchema } from '../../../../src/routes/v2/model/images/deleteImage.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/registry.js', () => ({
  listModelImages: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > images > getImages', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/registry.js', () => ({
      softDeleteImage: vi.fn(),
    }))

    const fixture = createFixture(deleteImageSchema)
    const res = await testDelete(
      `/api/v2/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}`,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/registry.js', () => ({
      softDeleteImage: vi.fn(),
    }))

    const fixture = createFixture(deleteImageSchema)
    const res = await testDelete(
      `/api/v2/model/${fixture.params.modelId}/image/${fixture.params.name}/${fixture.params.tag}`,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteImage).toBeCalled()
    expect(audit.onDeleteImage.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onDeleteImage.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
