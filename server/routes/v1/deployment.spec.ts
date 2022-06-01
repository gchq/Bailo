import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'
import DeploymentModel, { ApprovalStates } from '../../models/Deployment'
import { ObjectId } from 'mongodb'
import UserModel from '../../models/User'
import * as deploymentService from '../../services/deployment'
import * as versionService from '../../services/version'
import * as requestService from '../../services/request'
import * as validateSchemaUtil from '../../utils/validateSchema'
import VersionModel from '../../models/Version'
import SchemaModel from '../../models/Schema'
import ModelModel from '../../models/Model'

const request = supertest(server)
const deploymentUuid = 'test-deployment'

const deploymentSchema: any = {
  name: 'deployment-schema',
  reference: 'test-schema',
  use: 'DEPLOYMENT',
  schema: {},
}

const uploadData: any = {
  schemaRef: 'test-schema',
  highLevelDetails: {
    initialVersionRequested: 1,
    name: 'test-deployment',
    modelID: 'test-model',
  },
  contacts: {
    requester: 'user',
  },
}

const deploymentData: any = {
  managerApproved: ApprovalStates.Accepted,
  built: false,
  schemaRef: 'test-schema',
  uuid: deploymentUuid,
  model: new ObjectId(),
  metadata: uploadData,
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

let deploymentDoc: any

const testVersion: any = {
  model: new ObjectId(),
  version: '1',
  metadata: {
    highLevelDetails: {
      name: 'test',
    },
    contacts: {
      uploader: 'user',
      reviewer: 'reviewer',
      manager: 'manager',
    },
  },
  built: false,
  managerApproved: ApprovalStates.Accepted,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

let versionDoc: any

const testUser: any = {
  id: 'user',
  email: 'test',
}

const testManager: any = {
  id: 'manager',
  email: 'test',
}

const testModel: any = {
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'test-model',
  currentMetadata: {},
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const managerRequest: any = {
  _id: 'managerId',
}

describe('test deployment routes', () => {
  beforeEach(async () => {
    deploymentDoc = await DeploymentModel.create(deploymentData)
    deploymentData._id = new ObjectId(deploymentDoc._id)
    await UserModel.create(testUser)
    await UserModel.create(testManager)
    await SchemaModel.create(deploymentSchema)
    await ModelModel.create(testModel)
    versionDoc = await VersionModel.create(testVersion)
  })

  test('find a deployment with a given uuid', async () => {
    const res = await request.get(`/api/v1/deployment/${deploymentUuid}`).set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('get user deployments', async () => {
    const deploymentArray: any = new Array(1).fill(deploymentData)
    const deploymentsMock = jest.spyOn(deploymentService, 'findDeployments')
    deploymentsMock.mockReturnValue(deploymentArray)
    const res = await request
      .get(`/api/v1/deployment/user/${deploymentData.metadata.contacts.requester}`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe(deploymentUuid)
  })

  test('reset approvals for deployment with a given uuid', async () => {
    const versionMock = jest.spyOn(versionService, 'findVersionByName')
    versionMock.mockReturnValue(versionDoc)
    const requestMock = jest.spyOn(requestService, 'createDeploymentRequests')
    requestMock.mockImplementation()
    const res = await request
      .post(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment', async () => {
    const mockValidation = jest.spyOn(validateSchemaUtil, 'validateSchema')
    mockValidation.mockReturnValue(null)
    const requestMock = jest.spyOn(requestService, 'createDeploymentRequests')
    requestMock.mockReturnValue(managerRequest)
    const res = await request.post('/api/v1/deployment').send(uploadData).set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
