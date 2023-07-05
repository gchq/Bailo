import '../../utils/mockMongo.js'

import mongoose from 'mongoose'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

import ModelModel from '../../models/Model.js'
import UserModel from '../../models/User.js'
import VersionModel from '../../models/Version.js'
import { testManager, testModel, testReviewer, testUser, testVersion } from '../../utils/test/testModels.js'

vi.mock('../../services/approval.js', () => {
  return {
    createVersionApprovals: vi.fn(),
  }
})

vi.mock('../../utils/entity.js', () => {
  return {
    isUserInEntityList: vi.fn(() => Promise.resolve(true)),
    parseEntityList: vi.fn((user) =>
      Promise.resolve({
        valid: true,
        entities: [
          {
            user,
          },
        ],
      })
    ),
  }
})

const mockAudit = {
  onModelVersionUpdate: vi.fn(() => Promise.resolve()),
}

vi.mock('../../external/Audit.js', () => {
  return {
    __esModule: true,
    default: mockAudit,
  }
})

const { authenticatedGetRequest, authenticatedPostRequest, authenticatedPutRequest, validateTestRequest } =
  await import('../../utils/test/testUtils.js')

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
    const editedVersion = testVersion
    editedVersion.metadata.highLevelDetails.name = 'test2'
    const res = await authenticatedPutRequest(`/api/v1/version/${testVersion._id}`).send(editedVersion.metadata)
    validateTestRequest(res)
    expect(mockAudit.onModelVersionUpdate).toBeCalledTimes(1)
    expect(res.body.metadata.highLevelDetails.name).toBe('test2')
  })

  test('that we can reset approvals for a version', async () => {
    const res = await authenticatedPostRequest(`/api/v1/version/${testVersion._id}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.managerApproved).toBe('No Response')
  })

  // test('that when we delete a version, we send an email to the relvant deployment owners', async () => {
  //   await ModelModel.create(testModel)
  //   const spy: any = jest.spyOn(approvalService, 'deleteApprovalsByVersion')
  //   spy.mockReturnValue({ irrelevant: 'content' })
  //   ;(deploymentService.findDeploymentsByModel as jest.Mock).mockImplementationOnce(() => ['deployment'])

  //   const res = await authenticatedDeleteRequest(`/api/v1/version/${testVersion._id}`)
  //   const versionafterDeletion = await VersionModel.findById(testVersion._id)

  //   validateTestRequest(res)
  //   // Assert version was deleted
  //   expect(res.body.id.toString()).toBe(testVersion._id.toString())
  //   expect(versionafterDeletion).toBeNull()
  //   expect(modelService.removeVersionFromModel).toHaveBeenCalledTimes(1)
  //   expect(approvalService.deleteApprovalsByVersion).toHaveBeenCalledTimes(1)
  //   // Assert email was sent to deployment owners
  //   expect(deploymentService.findDeploymentsByModel).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       id: testUser.id,
  //       email: testUser.email,
  //     }),
  //     expect.objectContaining({
  //       uuid: testModel.uuid,
  //       schemaRef: testModel.schemaRef,
  //     })
  //   )
  //   expect(deploymentService.emailDeploymentOwnersOnVersionDeletion).toHaveBeenCalledTimes(1)
  // })

  // test('that when we delete a version, we do not send an email to deployment owners if there are no deployments', async () => {
  //   await ModelModel.create(testModel)
  //   const spy: any = jest.spyOn(approvalService, 'deleteApprovalsByVersion')
  //   spy.mockReturnValue({ irrelevant: 'content' })

  //   const res = await authenticatedDeleteRequest(`/api/v1/version/${testVersion._id}`)
  //   const versionafterDeletion = await VersionModel.findById(testVersion._id)

  //   validateTestRequest(res)
  //   // Assert version was deleted
  //   expect(res.body.id.toString()).toBe(testVersion._id.toString())
  //   expect(versionafterDeletion).toBeNull()
  //   expect(modelService.removeVersionFromModel).toHaveBeenCalledTimes(1)
  //   expect(approvalService.deleteApprovalsByVersion).toHaveBeenCalledTimes(1)
  //   // Assert email was not sent to deployment owners
  //   expect(deploymentService.findDeploymentsByModel).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       id: testUser.id,
  //       email: testUser.email,
  //     }),
  //     expect.objectContaining({
  //       uuid: testModel.uuid,
  //       schemaRef: testModel.schemaRef,
  //     })
  //   )
  //   expect(deploymentService.emailDeploymentOwnersOnVersionDeletion).not.toBeCalled()
  // })

  afterAll(() => {
    mongoose.connection.close()
  })
})
