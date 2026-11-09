import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

const mockModelService = vi.hoisted(() => {
  return {
    popularTagsForEntries: vi.fn((_limit: number) => ['test-tag', 'test-tag2']),
    getModelById: vi.fn(() => {}),
  }
})
vi.mock('../../../../src/services/model.js', () => mockModelService)

describe('routes > model > tags > getPopularTags', () => {
  test('200 > ok', async () => {
    const res = await testGet(`/api/v2/models/tags`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('200 > defaults the limit to 10 when none is given', async () => {
    const res = await testGet(`/api/v2/models/tags`)

    expect(res.statusCode).toBe(200)
    expect(mockModelService.popularTagsForEntries).toHaveBeenLastCalledWith(10)
  })

  test('200 > uses the limit from the query', async () => {
    const res = await testGet(`/api/v2/models/tags?limit=25`)

    expect(res.statusCode).toBe(200)
    expect(mockModelService.popularTagsForEntries).toHaveBeenLastCalledWith(25)
  })

  test('400 > limit is zero', async () => {
    const res = await testGet(`/api/v2/models/tags?limit=0`)

    expect(res.statusCode).toBe(400)
  })

  test('400 > limit is above the maximum', async () => {
    const res = await testGet(`/api/v2/models/tags?limit=101`)

    expect(res.statusCode).toBe(400)
  })
})
