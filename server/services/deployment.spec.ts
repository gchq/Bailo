import '../utils/mockMongo'

import { ObjectId } from 'mongodb'

import DeploymentModel, { DeploymentDoc } from '../models/Deployment'
import UserModel from '../models/User'
import * as entityUtils from '../utils/entity'
import * as emailClient from '../utils/smtp'
import { deploymentUuid, testDeployment, testDeployment2, testUser, testVersion } from '../utils/test/testModels'
import {
  createDeployment,
  DeploymentFilter,
  emailDeploymentOwnersOnVersionDeletion,
  findDeploymentById,
  findDeploymentByUuid,
  findDeployments,
  serializedDeploymentFields,
} from './deployment'

const userDoc = new UserModel(testUser)

jest.mock('../utils/smtp', () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}))

describe('test deployment service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
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

  test('that we can email deployment owners about changes for multiple deployments', async () => {
    const deployments: DeploymentDoc[] = [testDeployment, testDeployment2]
    const spy: any = jest.spyOn(entityUtils, 'getUserListFromEntityList')
    const userList: object[] = [
      { name: 'Alice', email: 'alice@email.com' },
      { name: 'Bob', email: 'bob@email.com' },
    ]
    spy.mockReturnValue(userList)

    await emailDeploymentOwnersOnVersionDeletion(deployments, testVersion)

    expect(emailClient.sendEmail).toHaveBeenCalledTimes(deployments.length * userList.length)
  })

  test('that we can email deployment owners about changes for a single deployment', async () => {
    const deployments: DeploymentDoc[] = [testDeployment]
    const spy: any = jest.spyOn(entityUtils, 'getUserListFromEntityList')
    const userList: Array<any> = [
      { name: 'Alice', email: 'alice@email.com' },
      { name: 'Bob', email: 'bob@email.com' },
    ]
    spy.mockReturnValue(userList)

    await emailDeploymentOwnersOnVersionDeletion(deployments, testVersion)

    // Assert that for each deployment, each owner has been send an email about that deployment
    for (const deployment of deployments) {
      for (const user of userList) {
        expect(emailClient.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: user.email,
            subject: `Your deployment '${deployment.metadata.highLevelDetails.name}' is being updated.`,
          })
        )
      }
    }
  })
})
