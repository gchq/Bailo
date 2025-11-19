import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

const mockModelService = vi.hoisted(() => {
  return {
    popularTagsForEntries: vi.fn(() => ['test-tag', 'test-tag2']),
    getModelById: vi.fn(() => {}),
  }
})
vi.mock('../../../../src/services/model.js', () => mockModelService)

describe('routes > model > tags > getPopularTags', () => {
  test('200 > ok', async () => {
    const res = await testGet(`/api/v2/model/tags`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
