import mongoose from 'mongoose'
import ApprovalModel from '../../models/Approval.js'
import { readApprovals, readNumApprovals } from '../../services/approval.js'
import { findAndUpdateUser } from '../../services/user.js'
import '../../utils/mockMongo'
import { testApproval, testUser } from '../../utils/test/testModels.js'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils.js'

jest.mock('../../services/approval.js', () => {
  const original = jest.requireActual('../../services/approval.js')
  return {
    ...original,
    readApprovals: jest.fn(),
    readNumApprovals: jest.fn(),
  }
})

describe('test approvals routes', () => {
  beforeAll(async () => {
    const userDoc: any = await findAndUpdateUser(testUser)
    testUser._id = userDoc._id
    testApproval.user = userDoc._id
    await ApprovalModel.create(testApproval)
  })

  test('that we can fetch approvals', async () => {
    ;(readApprovals as unknown as jest.Mock).mockReturnValueOnce([testApproval])
    const res = await authenticatedGetRequest('/api/v1/approvals?approvalCategory=Upload')
    validateTestRequest(res)
    expect(res.body.approvals.length).toBe(1)
  })

  test('that we can fetch approvals count', async () => {
    ;(readNumApprovals as unknown as jest.Mock).mockReturnValueOnce(1)
    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    validateTestRequest(res)
    expect(res.body.count).toBe(1)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
