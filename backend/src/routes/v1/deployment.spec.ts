import { ObjectId } from 'mongodb'
import { jest } from '@jest/globals'
import mongoose from 'mongoose'
import DeploymentModel from '../../models/Deployment.js'
import ModelModel from '../../models/Model.js'
import SchemaModel from '../../models/Schema.js'
import UserModel from '../../models/User.js'
import VersionModel from '../../models/Version.js'
import '../../utils/mockMongo.js'
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

const approval = await import('../../services/approval.js')
jest.unstable_mockModule('../../services/approval.js', () => {
  return {
    ...approval,
    createDeploymentApprovals: jest.fn(),
  }
})

const { createDeploymentApprovals } = await import('../../services/approval.js')

const deployment = await import('../../services/deployment.js')
jest.unstable_mockModule('../../services/deployment.js', () => {
  return {
    ...deployment,
    findDeployments: jest.fn(),
  }
})

const { findDeployments } = await import('../../services/deployment.js')

const version = await import('../../services/version.js')
jest.unstable_mockModule('../../services/version.js', () => {
  return {
    ...version,
    findVersionByName: jest.fn(),
  }
})

const { findVersionByName } = await import('../../services/version.js')

const validateSchemaModule = await import('../../utils/validateSchema.js')
jest.unstable_mockModule('../../utils/validateSchema.js', () => {
  return {
    ...validateSchemaModule,
    validateSchema: jest.fn(),
  }
})

const { validateSchema } = await import('../../utils/validateSchema.js')

const { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } = await import(
  '../../utils/test/testUtils.js'
)

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
    ;(findDeployments as unknown as jest.Mock).mockReturnValueOnce(deploymentArray)
    const res = await authenticatedGetRequest(`/api/v1/deployment/user/${testDeployment.metadata.contacts.owner.id}`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe(deploymentUuid)
  })

  test('reset approvals for deployment with a given uuid', async () => {
    ;(findVersionByName as unknown as jest.Mock).mockReturnValueOnce(versionDoc)
    ;(createDeploymentApprovals as unknown as jest.Mock).mockReturnValueOnce(undefined)
    const res = await authenticatedPostRequest(`/api/v1/deployment/${deploymentUuid}/reset-approvals`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(deploymentUuid)
  })

  test('that we can request a deployment', async () => {
    ;(validateSchema as unknown as jest.Mock).mockReturnValueOnce(null)
    ;(createDeploymentApprovals as unknown as jest.Mock).mockReturnValueOnce(managerApproval)
    const res = await authenticatedPostRequest('/api/v1/deployment').send(deploymentData)

    validateTestRequest(res)
    expect(Object.keys(res.body)[0]).toBe('uuid')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
