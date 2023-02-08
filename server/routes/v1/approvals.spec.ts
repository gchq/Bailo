import mongoose from 'mongoose'
import ApprovalModel from '../../models/Approval.js'
import * as approvalService from '../../services/approval.js'
import { findAndUpdateUser } from '../../services/user.js'
import '../../utils/mockMongo'
import { testApproval, testUser } from '../../utils/test/testModels.js'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils.js'

describe('test approvals routes', () => {
  beforeAll(async () => {
    const userDoc: any = await findAndUpdateUser(testUser)
    testUser._id = userDoc._id
    testApproval.user = userDoc._id
    await ApprovalModel.create(testApproval)
  })

  test('that we can fetch approvals', async () => {
    const mock = jest.spyOn(approvalService, 'readApprovals')
    const approvalArray: any = []
    approvalArray.push(testApproval)
    mock.mockReturnValue(approvalArray)
    const res = await authenticatedGetRequest('/api/v1/approvals?approvalCategory=Upload')
    validateTestRequest(res)
    expect(res.body.approvals.length).toBe(1)
  })

  test('that we can fetch approvals count', async () => {
    const mock = jest.spyOn(approvalService, 'readNumApprovals')
    const mockedReturnCount: any = 1
    mock.mockReturnValue(mockedReturnCount)
    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    validateTestRequest(res)
    expect(res.body.count).toBe(1)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
