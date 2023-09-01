import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockApprovalService = vi.hoisted(() => {
  return {
    countApprovals: vi.fn(() => 7),
  }
})
vi.mock('../../../src/services/v2/approval.js', () => mockApprovalService)

describe('routes > schema > getApprovals', () => {
  test('returns approvals count', async () => {
    const res = await testGet(`/api/v2/approvals/count`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

})
