import { ObjectId } from 'mongodb'
import { ApprovalStates, DeploymentDoc } from '../models/Deployment.js'
import RequestModel, { RequestTypes } from '../models/Request.js'
import { VersionDoc } from '../models/Version.js'
import '../utils/mockMongo'
import { createDeploymentRequests, createVersionRequests, getRequest, readNumRequests, readRequests } from './request.js'
import { findAndUpdateUser } from './user.js'
import * as userService from './user.js'
import ModelModel from '../models/Model.js'
import * as emailService from '../utils/smtp.js'

const managerId = new ObjectId()
const modelId = new ObjectId()
const userId = new ObjectId()
const requestId = new ObjectId()

const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test',
  currentMetadata: {
    highLevelDetails: {
      name: 'model1',
    },
  },
  owner: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const versionData: any = {
  model: testModel,
  version: '1',
  metadata: {
    highLevelDetails: {
      name: 'model1',
    },
    contacts: {
      uploader: userId,
      manager: managerId,
    },
  },
  built: false,
  managerApproved: ApprovalStates.NoResponse,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const version = versionData as VersionDoc

const deploymentData: any = {
  managerApproved: ApprovalStates.NoResponse,
  built: false,
  schemaRef: 'test-schema',
  uuid: 'test-deployment',
  model: testModel,
  metadata: {
    highLevelDetails: {
      name: 'deployment1',
    },
    contacts: {
      requester: userId,
    },
  },
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const deployment = deploymentData as DeploymentDoc

const testUser: any = {
  _id: managerId,
  userId: 'user1',
  email: 'user1@email.com',
  data: { some: 'value' },
}

const testRequest = {
  status: 'No Response',
  _id: requestId,
  approvalType: 'Manager',
  request: 'Upload',
  user: userId,
  version: null,
  __v: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('test request service', () => {
  beforeEach(async () => {
    await findAndUpdateUser(testUser)
    await ModelModel.create(testModel)
    await RequestModel.create(testRequest)
  })

  test('that we can create a deployment request object', async () => {
    const getUserMock = jest.spyOn(userService, 'getUserById')
    getUserMock.mockReturnValue(testUser)
    const emailMock = jest.spyOn(emailService, 'sendEmail')
    emailMock.mockImplementation()
    const request = await createDeploymentRequests({ version, deployment })
    expect(request).not.toBe(undefined)
    expect(request.approvalType).toBe('Manager')
    expect(request.request).toBe('Deployment')
  })

  test('that we can create a version request object', async () => {
    const getUserMock = jest.spyOn(userService, 'getUserById')
    getUserMock.mockReturnValue(testUser)
    const emailMock = jest.spyOn(emailService, 'sendEmail')
    emailMock.mockImplementation()
    const requests = await createVersionRequests({ version })
    expect(requests).not.toBe(undefined)
    expect(requests.length).toBe(2)
    expect(requests[0].request).toBe('Upload')
  })

  test('that we can read the number of requests has', async () => {
    const requests = await readNumRequests({ userId })
    expect(requests).toBe(1)
  })

  test('that we can read the requests', async () => {
    const requests = await readRequests({ type: RequestTypes.Upload, filter: undefined })
    expect(requests).not.toBe(undefined)
    expect(requests.length).toBe(1)
    expect(requests[0].request).toBe('Upload')
  })

  test('we can fetch an individual request by its ID', async () => {
    const request = await getRequest({ requestId })
    expect(request).not.toBe(undefined)
    expect(request.request).toBe('Upload')
  })
})
