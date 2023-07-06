import '../utils/mockMongo'
import '../models/Model.js'

import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DeploymentModel from '../models/Deployment.js'
import UserModel from '../models/User.js'
import { serializedDeploymentFields } from '../utils/serializers.js'
import { deploymentUuid, testDeployment, testDeployment2, testUser } from '../utils/test/testModels.js'
import {
  createDeployment,
  DeploymentFilter,
  findDeploymentById,
  findDeploymentByUuid,
  findDeployments,
} from './deployment.js'

const userDoc = new UserModel(testUser)

vi.mock('../utils/smtp.js', () => {
  return {
    sendEmail: vi.fn(),
  }
})

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

  // test('that we can email deployment owners about changes for multiple deployments', async () => {
  //   const deployments: DeploymentDoc[] = [testDeployment, testDeployment2]
  //   const spy: any = jest.spyOn(entityUtils, 'getUserListFromEntityList')
  //   const userList: any[] = [testUser, testUser2]
  //   spy.mockReturnValue(userList)

  //   await emailDeploymentOwnersOnVersionDeletion(deployments, testVersion)

  //   assertThatAnEmailHasBeenSentToDeploymentOwners(deployments, userList)
  // })

  // test('that we can email deployment owners about changes for a single deployment', async () => {
  //   const deployments: DeploymentDoc[] = [testDeployment]
  //   const spy: any = jest.spyOn(entityUtils, 'getUserListFromEntityList')
  //   const userList: any[] = [testUser, testUser2]
  //   spy.mockReturnValue(userList)

  //   await emailDeploymentOwnersOnVersionDeletion(deployments, testVersion)

  //   assertThatAnEmailHasBeenSentToDeploymentOwners(deployments, userList)
  // })

  // function assertThatAnEmailHasBeenSentToDeploymentOwners(deployments: any[], userList: any[]) {
  //   for (const deployment of deployments) {
  //     for (const user of userList) {
  //       expect(emailClient.sendEmail).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           to: user.email,
  //           subject: `Your deployment '${deployment.metadata.highLevelDetails.name}' is being updated.`,
  //         })
  //       )
  //     }
  //   }
  // }
})
