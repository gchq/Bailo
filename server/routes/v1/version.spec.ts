import mongoose from 'mongoose'
import ModelModel from '../../models/Model.js'
import UserModel from '../../models/User.js'
import VersionModel from '../../models/Version.js'
import { createVersionApprovals } from '../../services/approval.js'
import '../../utils/mockMongo'
import { testUser, testManager, testReviewer, testVersion, testModel } from '../../utils/test/testModels.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPutRequest,
  validateTestRequest,
} from '../../utils/test/testUtils.js'

jest.mock('../../services/approval.js', () => {
  const original = jest.requireActual('../../services/approval.js')
  return {
    ...original,
    createVersionApprovals: jest.fn(),
  }
})

describe('test version routes', () => {
  beforeEach(async () => {
    await UserModel.create(testUser)
    await UserModel.create(testManager)
    await UserModel.create(testReviewer)

    await ModelModel.create(testModel)
    const versionDoc = await VersionModel.create(testVersion)
    testVersion._id = versionDoc._id
  })

  test('that we can fetch a version by its ID', async () => {
    const res = await authenticatedGetRequest(`/api/v1/version/${testVersion._id}`)
    validateTestRequest(res)
    expect(res.body.version).toBe('1')
  })

  test('that we can edit a version', async () => {
    ;(createVersionApprovals as unknown as jest.Mock).mockImplementation()
    const editedVersion = testVersion
    editedVersion.metadata.highLevelDetails.name = 'test2'
    const res = await authenticatedPutRequest(`/api/v1/version/${testVersion._id}`).send(editedVersion.metadata)
    validateTestRequest(res)
    expect(res.body.metadata.highLevelDetails.name).toBe('test2')
  })

  test('that we can reset approvals for a version', async () => {
    ;(createVersionApprovals as unknown as jest.Mock).mockImplementation()
    const res = await authenticatedPostRequest(`/api/v1/version/${testVersion._id}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.managerApproved).toBe('No Response')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
