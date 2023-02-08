import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import DeploymentModel from '../../models/Deployment.js'
import ModelModel from '../../models/Model.js'
import SchemaModel from '../../models/Schema.js'
import UserModel from '../../models/User.js'
import VersionModel from '../../models/Version.js'
import * as deploymentService from '../../services/deployment.js'
import * as approvalService from '../../services/approval.js'
import * as versionService from '../../services/version.js'
import '../../utils/mockMongo'
import {
  deploymentSchema,
  deploymentUuid,
  managerApproval,
  testDeployment,
  testManager,
  testModel,
  testUser,
  testVersion,
  deploymentData,
} from '../../utils/test/testModels.js'
import { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils.js'
import * as validateSchemaUtil from '../../utils/validateSchema.js'

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
    const deploymentArray: any = new Array(1).fill(testDeployment)
    const deploymentsMock = jest.spyOn(deploymentService, 'findDeployments')
    deploymentsMock.mockReturnValue(deploymentArray)
    const res = await authenticatedGetRequest(`/api/v1/deployment/user/${testDeployment.metadata.contacts.requester}`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe(deploymentUuid)
  })

  test('reset approvals for deployment with a given uuid', async () => {
    const versionMock = jest.spyOn(versionService, 'findVersionByName')
    versionMock.mockReturnValue(versionDoc)
    const approvalMock = jest.spyOn(approvalService, 'createDeploymentApprovals')
    approvalMock.mockImplementation()
    const res = await authenticatedPostRequest(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment', async () => {
    const mockValidation = jest.spyOn(validateSchemaUtil, 'validateSchema')
    mockValidation.mockReturnValue(null)
    const approvalMock = jest.spyOn(approvalService, 'createDeploymentApprovals')
    approvalMock.mockReturnValue(managerApproval)
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    validateTestRequest(res)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
