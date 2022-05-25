import { ObjectId } from 'mongodb'
import UserModel from '../models/User'
import DeploymentModel, { DeploymentDoc } from '../models/Deployment'
import Deployment, { ApprovalStates } from '../models/Deployment'
import '../utils/mockMongo'
import { findDeploymentByUuid, serializedDeploymentFields, findDeploymentById, findDeployments, DeploymentFilter, markDeploymentBuilt, createDeployment } from './deployment'

const requesterId = new ObjectId()
const deploymentUuid = 'test-deployment'

const deploymentData: any = {
  managerApproved: ApprovalStates.NoResponse,
  built: false,
  schemaRef: 'test-schema',
  uuid: deploymentUuid,
  model: new ObjectId(),
  metadata: {
    contacts: {
      requester: requesterId
    }
  },
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const deploymentData2: any = {
  managerApproved: ApprovalStates.NoResponse,
  built: false,
  schemaRef: 'test-schema3',
  uuid: deploymentUuid,
  model: new ObjectId(),
  metadata: {
    contacts: {
      requester: requesterId
    }
  },
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testUser = {
  userId: 'user1',
  email: 'user1@email.com',
  data: { some: 'value' },
}
const userDoc = new UserModel(testUser)

describe('test deployment service', () => {

  beforeEach(async () => {
    const deploymentDoc: any = await DeploymentModel.create(deploymentData)
    deploymentData._id = new ObjectId(deploymentDoc._id)
  })

  test('that the serializer returns the correct properties', () => {
    // Need to improve this by testing an actual log entry to see if it has just the properties below
    const properties = serializedDeploymentFields()
    expect(properties.mandatory).toStrictEqual(['_id', 'uuid', 'name'])
  })

  test('that we can find a deployment by its UUID', async () => {
    const deployment : any = await findDeploymentByUuid(userDoc, deploymentUuid)
    expect(deployment).not.toBe(undefined)
    expect(deployment.schemaRef).toBe(deploymentData.schemaRef)
  })

  test('that we can find a deployment by its ID', async () => {
    const deployment: any = await findDeploymentById(userDoc, deploymentData._id)
    expect(deployment).not.toBe(undefined)
    expect(deployment.uuid).toBe(deploymentData.uuid)
  })

  test('we can fetch all deployments', async () => {
    const deploymentFilter: any = {}
    const deployments: any = await findDeployments(userDoc, deploymentFilter as DeploymentFilter) 
    expect(deployments).not.toBe(undefined)
    expect(deployments.length).toBe(1)
  })

  test('that we can create a new deployment document', async () => {
    const deployment: any = await createDeployment(userDoc, deploymentData2)
    expect(deployment).not.toBe(undefined)
    expect(deployment._id).not.toBe(undefined)
    expect(deployment.uuid).toBe(deploymentData2.uuid)
  })

})