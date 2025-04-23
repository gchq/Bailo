import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { createFixture, testPost } from '../../testUtils/routes.js'
import { testReviewRole } from '../../testUtils/testModels.js'
import { postReviewRoleSchema } from '../../../src/routes/v2/review/postReviewRole.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockReviewService = vi.hoisted(() => {
  return {
    createReviewRole: vi.fn(() => testReviewRole),
  }
})
vi.mock('../../../src/services/review.js', () => mockReviewService)

describe('routes > review > postReviewRole', () => {
  const endpoint = `/api/v2/review/role`

  test('audit > expected call', async () => {
    const res = await testPost(`${endpoint}`, createFixture(postReviewRoleSchema))

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReviewRole).toBeCalled()
    expect(audit.onCreateReviewRole.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('creates and returns new review role', async () => {
    const res = await testPost(`${endpoint}`, createFixture(postReviewRoleSchema))

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
