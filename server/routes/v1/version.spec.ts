import '../../utils/mockMongo'

import mongoose from 'mongoose'

import * as modelModel from '../../models/Model'
import UserModel from '../../models/User'
import VersionModel from '../../models/Version'
import * as approvalService from '../../services/approval'
import { testManager, testReviewer, testUser, testVersion } from '../../utils/test/testModels'
import {
  authenticatedDeleteRequest,
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPutRequest,
  validateTestRequest,
} from '../../utils/test/testUtils'

jest.mock('../../services/model', () => ({
  removeVersionFromModel: jest.fn(() => Promise.resolve()),
  serializedModelFields: () => ({
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }),
}))

jest.mock('../../services/deployment', () => ({
  findDeploymentsByModel: jest.fn(() => Promise.resolve({ irrelevant: 'content' })),
  emailDeploymentOwnersOnVersionDeletion: jest.fn(() => Promise.resolve({ irrelevant: 'content' })),
  serializedDeploymentFields: () => ({
    mandatory: ['_id', 'uuid', 'name'],
    optional: [],
    serializable: [],
  }),
}))

describe('test version routes', () => {
  beforeEach(async () => {
    await UserModel.create(testUser)
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

  test('that we can delete a version by its ID', async () => {
    jest.mock('../../models/Model', () => ({
      findById: jest.fn(() => Promise.resolve({ '': '' })),
    }))
    const spy: any = jest.spyOn(modelModel, 'findById')
    const res = await authenticatedDeleteRequest(`/api/v1/version/${testVersion._id}`)

    validateTestRequest(res)
    expect(res.body.id.toString()).toBe(testVersion._id.toString())
  })

  test('that we can edit a version', async () => {
    const mock: any = jest.spyOn(approvalService, 'createVersionApprovals')
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
