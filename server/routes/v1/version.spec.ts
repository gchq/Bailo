import mongoose from 'mongoose'
import UserModel from '../../models/User'
import VersionModel from '../../models/Version'
import * as requestService from '../../services/request'
import '../../utils/mockMongo'
import { testManager, testReviewer, testVersion } from '../../utils/test/testModels'
import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPutRequest,
  validateTestRequest,
} from '../../utils/test/testUtils'

describe('test version routes', () => {
  beforeEach(async () => {
    await UserModel.create(testManager)
    await UserModel.create(testReviewer)
    const versionDoc = await VersionModel.create(testVersion)
    testVersion._id = versionDoc._id
  })

  test('that we can fetch a version by its ID', async () => {
    const res = await authenticatedGetRequest(`/api/v1/version/${testVersion._id}`)
    validateTestRequest(res)
    expect(res.body.version).toBe('1')
  })

  test('that we can edit a version', async () => {
    const mock: any = jest.spyOn(requestService, 'createVersionRequests')
    const editedVersion = testVersion
    editedVersion.metadata.highLevelDetails.name = 'test2'
    mock.mockReturnValue({})
    const res = await authenticatedPutRequest(`/api/v1/version/${testVersion._id}`).send(editedVersion.metadata)
    validateTestRequest(res)
    expect(res.body.metadata.highLevelDetails.name).toBe('test2')
  })

  test('that we can reset approvals for a version', async () => {
    const res = await authenticatedPostRequest(`/api/v1/version/${testVersion._id}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.managerApproved).toBe('No Response')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
