import '../../utils/mockMongo.js'

import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

import DeploymentModel from '../../models/Deployment.js'
import ModelModel from '../../models/Model.js'
import SchemaModel from '../../models/Schema.js'
import UserModel from '../../models/User.js'
import * as approval from '../../services/approval.js'
import * as deployment from '../../services/deployment.js'
import * as version from '../../services/version.js'
import { DeploymentDoc, VersionDoc } from '../../types/types.js'
import * as entityUtils from '../../utils/entity.js'
import {
  deploymentData,
  deploymentSchema,
  deploymentUuid,
  managerApproval,
  testApprovedVersion,
  testDeployment,
  testManager,
  testManagerApprovedVersion,
  testModel,
  testReviewerApprovedVersion,
  testUser,
  testVersion,
} from '../../utils/test/testModels.js'
import { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils.js'
import * as validateSchema from '../../utils/validateSchema.js'

let deploymentDoc: DeploymentDoc

describe('test deployment routes', () => {
  beforeEach(async () => {
    deploymentDoc = await DeploymentModel.create(testDeployment)
    testDeployment._id = new ObjectId(deploymentDoc._id)
    await UserModel.create(testUser)
    await UserModel.create(testManager)
    await SchemaModel.create(deploymentSchema)
    await ModelModel.create(testModel)
  })

  test('find a deployment with a given uuid', async () => {
    const res = await authenticatedGetRequest(`/api/v1/deployment/${deploymentUuid}`)
    validateTestRequest(res)
    expect(res.body).not.toBe(undefined)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('get user deployments', async () => {
    const deploymentArray = new Array(1).fill(testDeployment)
    vi.spyOn(deployment, 'findDeployments').mockResolvedValueOnce(deploymentArray)

    const res = await authenticatedGetRequest(`/api/v1/deployment/user/${testDeployment.metadata.contacts.owner.id}`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe(deploymentUuid)
  })

  test('reset approvals for deployment with a given uuid', async () => {
    vi.spyOn(version, 'findVersionById').mockResolvedValueOnce(testVersion)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(undefined as any)
    vi.spyOn(entityUtils, 'isUserInEntityList').mockResolvedValueOnce(true)
    const res = await authenticatedPostRequest(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment given the version has manager and reviewer approvals', async () => {
    vi.spyOn(validateSchema, 'validateSchema').mockReturnValueOnce(null)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(managerApproval)
    vi.spyOn(version, 'findVersionById').mockResolvedValueOnce(testVersion)
    const approvedVersion = testApprovedVersion as VersionDoc
    vi.spyOn(version, 'findModelVersions').mockResolvedValueOnce([approvedVersion])

    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    validateTestRequest(res)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  test('that we cannot request a deployment given the version does not have reviewer approval', async () => {
    // Given
    vi.spyOn(validateSchema, 'validateSchema').mockReturnValueOnce(null)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(managerApproval)
    vi.spyOn(version, 'findVersionById').mockResolvedValueOnce(testManagerApprovedVersion)

    // When
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    // Then
    expect(res.status).toBe(400)
  })

  test('that we cannot request a deployment given the version does not have manager approval', async () => {
    // Given
    vi.spyOn(validateSchema, 'validateSchema').mockReturnValueOnce(null)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(managerApproval)
    vi.spyOn(version, 'findVersionById').mockResolvedValueOnce(testReviewerApprovedVersion)

    // When
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    // Then
    expect(res.status).toBe(400)
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})
