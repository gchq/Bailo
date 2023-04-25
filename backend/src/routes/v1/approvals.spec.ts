import { describe, expect, test, vi } from 'vitest'

import * as approval from '../../services/approval.js'
import { authenticatedGetRequest } from '../../utils/test/testUtils.js'

describe('test approvals routes', () => {
  test('that we can fetch approvals count', async () => {
    vi.spyOn(approval, 'readNumApprovals').mockResolvedValue(1)

    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    expect(res.body.count).toBe(1)
  })
})
