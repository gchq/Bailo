import { ObjectId } from 'mongodb'
import { ApprovalStates, EntityKind } from '../../types/interfaces'
import { DeploymentDoc } from '../models/Deployment'
import ModelModel from '../models/Model'
import ApprovalModel, { ApprovalCategory } from '../models/Approval'
import UserModel from '../models/User'
import VersionModel, { VersionDoc } from '../models/Version'
import '../utils/mockMongo'
import * as emailService from '../utils/smtp'
import {
  createDeploymentApprovals,
  createVersionApprovals,
  getApproval,
  readNumApprovals,
  readApprovals,
} from './approval'
import * as userService from './user'

const managerId = new ObjectId()
const modelId = new ObjectId()
const userId = new ObjectId()
const approvalId = new ObjectId()
const versionId = new ObjectId()

const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test',
  latestVersion: versionId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const versionData: any = {
  _id: versionId,
  model: testModel,
  version: '1',
  metadata: {
    highLevelDetails: {
      name: 'model1',
    },
    contacts: {
      uploader: [{ kind: EntityKind.USER, id: 'user1' }],
      reviewer: [{ kind: EntityKind.USER, id: 'user1' }],
      manager: [{ kind: EntityKind.USER, id: 'manager1' }],
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
      owner: [{ kind: EntityKind.USER, id: 'user1' }],
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

const deployment = deploymentData as DeploymentDoc

const testUser: any = {
  _id: userId,
  id: 'user1',
  email: 'user1@email.com',
  data: { some: 'value' },
}

const testManager: any = {
  _id: managerId,
  id: 'manager1',
  email: 'manager1@email.com',
  data: { some: 'value' },
}

const testApproval = {
  status: 'No Response',
  _id: approvalId,
  approvalType: 'Manager',
  approvalCategory: 'Upload',
  approvers: [{ kind: EntityKind.USER, id: 'user1' }],
  version: null,
  __v: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('test approval service', () => {
  beforeEach(async () => {
    await UserModel.create(testUser)
    await UserModel.create(testManager)
    await ModelModel.create(testModel)
    await ApprovalModel.create(testApproval)
    await VersionModel.create(versionData)
  })

  test('that we can create a deployment approval object', async () => {
    const getUserMock = jest.spyOn(userService, 'getUserById')
    getUserMock.mockReturnValue(testUser)
    const emailMock = jest.spyOn(emailService, 'sendEmail')
    emailMock.mockImplementation()
    const approval = await createDeploymentApprovals({ deployment, user: testUser })
    expect(approval).not.toBe(undefined)
    expect(approval.approvalType).toBe('Manager')
    expect(approval.approvalCategory).toBe('Deployment')
  })

  test('that we can create a version approval object', async () => {
    const getUserMock = jest.spyOn(userService, 'getUserById')
    getUserMock.mockReturnValue(testUser)
    const emailMock = jest.spyOn(emailService, 'sendEmail')
    emailMock.mockImplementation()
    const approvals = await createVersionApprovals({ version, user: testUser })
    expect(approvals).not.toBe(undefined)
    expect(approvals.length).toBe(2)
    expect(approvals[0].approvalCategory).toBe('Upload')
  })

  test('that we can read the number of approvals has', async () => {
    const approvals = await readNumApprovals({ userId })
    expect(approvals).toBe(1)
  })

  test('that we can read the approvals', async () => {
    const approvals = await readApprovals({
      approvalCategory: ApprovalCategory.Upload,
      filter: undefined,
      archived: false,
    })
    expect(approvals).not.toBe(undefined)
    expect(approvals.length).toBe(1)
    expect(approvals[0].approvalCategory).toBe('Upload')
  })

  test('we can fetch an individual approval by its ID', async () => {
    const approval = await getApproval({ approvalId })
    expect(approval).not.toBe(undefined)
    expect(approval.approvalCategory).toBe('Upload')
  })
})
