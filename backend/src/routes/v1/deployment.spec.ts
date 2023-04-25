import '../../utils/mockMongo.js'

import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

import DeploymentModel from '../../models/Deployment.js'
import ModelModel from '../../models/Model.js'
import SchemaModel from '../../models/Schema.js'
import UserModel from '../../models/User.js'
import VersionModel from '../../models/Version.js'
import * as approval from '../../services/approval.js'
import * as deployment from '../../services/deployment.js'
import * as version from '../../services/version.js'
import * as entityUtils from '../../utils/entity.js'
import {
  deploymentData,
  deploymentSchema,
  deploymentUuid,
  managerApproval,
  testDeployment,
  testManager,
  testModel,
  testUser,
  testVersion,
} from '../../utils/test/testModels.js'
import { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils.js'
import * as validateSchema from '../../utils/validateSchema.js'

let deploymentDoc: any
let versionDoc: any

describe('test deployment routes', () => {
  beforeEach(async () => {
    deploymentDoc = await DeploymentModel.create(testDeployment)
    testDeployment._id = new ObjectId(deploymentDoc._id)
    await UserModel.create(testUser)
    await UserModel.create(testManager)
    await SchemaModel.create(deploymentSchema)
    await ModelModel.create(testModel)
    versionDoc = await VersionModel.create(testVersion)
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
    vi.spyOn(version, 'findVersionByName').mockReturnValueOnce(versionDoc)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(undefined as any)
    vi.spyOn(entityUtils, 'isUserInEntityList').mockResolvedValueOnce(true)
    const res = await authenticatedPostRequest(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment', async () => {
    vi.spyOn(validateSchema, 'validateSchema').mockReturnValueOnce(null)
    vi.spyOn(approval, 'createDeploymentApprovals').mockResolvedValueOnce(managerApproval)
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    validateTestRequest(res)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})
