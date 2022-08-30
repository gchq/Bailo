import { ObjectId } from 'mongodb'
import DeploymentModel from '../models/Deployment'
import UserModel from '../models/User'
import '../utils/mockMongo'
import { deploymentUuid, testDeployment, testDeployment2, testUser } from '../utils/test/testModels'
import {
  createDeployment,
  DeploymentFilter,
  findDeploymentById,
  findDeploymentByUuid,
  findDeployments,
  serializedDeploymentFields,
} from './deployment'

const userDoc = new UserModel(testUser)

describe('test deployment service', () => {
  beforeEach(async () => {
    const deploymentDoc: any = await DeploymentModel.create(testDeployment)
    testDeployment._id = new ObjectId(deploymentDoc._id)
  })

  test('that the serializer returns the correct properties', () => {
    // Need to improve this by testing an actual log entry to see if it has just the properties below
    const properties = serializedDeploymentFields()
    expect(properties.mandatory).toStrictEqual(['_id', 'uuid', 'name'])
  })

  test('that we can find a deployment by its UUID', async () => {
    const deployment: any = await findDeploymentByUuid(userDoc, deploymentUuid)
    expect(deployment).not.toBe(undefined)
    expect(deployment.schemaRef).toBe(testDeployment.schemaRef)
  })

  test('that we can find a deployment by its ID', async () => {
    const deployment: any = await findDeploymentById(userDoc, testDeployment._id)
    expect(deployment).not.toBe(undefined)
    expect(deployment.uuid).toBe(testDeployment.uuid)
  })

  test('we can fetch all deployments', async () => {
    const deploymentFilter: any = {}
    const deployments: any = await findDeployments(userDoc, deploymentFilter as DeploymentFilter)
    expect(deployments).not.toBe(undefined)
    expect(deployments.length).toBe(1)
  })

  test('that we can create a new deployment document', async () => {
    const deployment: any = await createDeployment(userDoc, testDeployment2)
    expect(deployment).not.toBe(undefined)
    expect(deployment._id).not.toBe(undefined)
    expect(deployment.uuid).toBe(testDeployment2.uuid)
  })
})
