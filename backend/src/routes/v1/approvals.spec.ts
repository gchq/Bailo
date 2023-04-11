import '../../utils/mockMongo.js'

import mongoose from 'mongoose'
import { afterAll, describe, expect, test, vi } from 'vitest'

import * as approval from '../../services/approval.js'
import { authenticatedGetRequest } from '../../utils/test/testUtils.js'

describe('test approvals routes', () => {
  test('that we can fetch approvals count', async () => {
    vi.spyOn(approval, 'readNumApprovals').mockReturnValue(Promise.resolve(1))

    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    expect(res.body.count).toBe(1)
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})
