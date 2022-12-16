import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import DeploymentModel from '../../models/Deployment'
import ModelModel from '../../models/Model'
import SchemaModel from '../../models/Schema'
import UserModel from '../../models/User'
import VersionModel from '../../models/Version'
import * as deploymentService from '../../services/deployment'
import * as requestService from '../../services/request'
import * as versionService from '../../services/version'
import '../../utils/mockMongo'
import {
  deploymentSchema,
  deploymentUuid,
  managerRequest,
  testDeployment,
  testManager,
  testModel,
  testUser,
  testVersion,
  deploymentData,
} from '../../utils/test/testModels'
import { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils'
import * as validateSchemaUtil from '../../utils/validateSchema'

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
    const requestMock = jest.spyOn(requestService, 'createDeploymentRequests')
    requestMock.mockImplementation()
    const res = await authenticatedPostRequest(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment', async () => {
    const mockValidation = jest.spyOn(validateSchemaUtil, 'validateSchema')
    mockValidation.mockReturnValue(null)
    const requestMock = jest.spyOn(requestService, 'createDeploymentRequests')
    requestMock.mockReturnValue(managerRequest)
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    validateTestRequest(res)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
