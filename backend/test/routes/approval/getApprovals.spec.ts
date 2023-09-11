import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'
import { testReleaseActiveApproval, testReleaseInactiveApproval } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockApprovalService = vi.hoisted(() => {
  return {
    findApprovalsByActive: vi.fn(() => [testReleaseInactiveApproval]),
  }
})
vi.mock('../../../src/services/v2/approval.js', () => mockApprovalService)

describe('routes > schema > getApprovals', () => {
  test('returns only inactive approvals', async () => {
    const res = await testGet(`/api/v2/approvals?active=false`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only active approvals', async () => {
    mockApprovalService.findApprovalsByActive.mockReturnValueOnce([testReleaseActiveApproval])
    const res = await testGet(`/api/v2/approvals?active=true`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing active parameter', async () => {
    const res = await testGet(`/api/v2/approvals`)

    expect(mockApprovalService.findApprovalsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing value for active parameter', async () => {
    const res = await testGet(`/api/v2/approvals?active`)

    expect(mockApprovalService.findApprovalsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
