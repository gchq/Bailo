import mongoose from 'mongoose'
import { jest } from '@jest/globals'
import '../../utils/mockMongo.js'

describe('test approvals routes', () => {
  test('that we can fetch approvals count', async () => {
    const approval = await import('../../services/approval.js')
    jest.unstable_mockModule('../../services/approval.js', () => {
      return {
        ...approval,
        readNumApprovals: jest.fn(() => 1),
      }
    })

    const { authenticatedGetRequest } = await import('../../utils/test/testUtils.js')

    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    expect(res.body.count).toBe(1)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
