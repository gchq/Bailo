import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../testUtils/routes.js'
import { testReviewRole } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockReviewService = vi.hoisted(() => {
  return {
    findReviewRoles: vi.fn(() => [testReviewRole]),
  }
})
vi.mock('../../../src/services/review.js', () => mockReviewService)

describe('routes > review > getReviewRoles', () => {
  const endpoint = `/api/v2/review/roles`

  test('audit > expected call', async () => {
    const res = await testGet(`${endpoint}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewReviewRoles).toBeCalled()
    expect(audit.onViewReviewRoles.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('returns review roles', async () => {
    const res = await testGet(`${endpoint}`)

    expect(res.statusCode).toBe(200)
    expect(res.header['x-count']).toBe('1')
    expect(res.body).matchSnapshot()
  })
})
