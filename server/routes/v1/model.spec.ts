import mongoose from 'mongoose'
import '../../utils/mockMongo'
import UserModel from '../../models/User'
import ModelModel from '../../models/Model'
import DeploymentModel, { ApprovalStates } from '../../models/Deployment'
import SchemaModel from '../../models/Schema'
import VersionModel from '../../models/Version'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils'
import { testUser, uploadSchema, testModel } from '../../utils/test/testModels'

describe('test model routes', () => {
  beforeEach(async () => {
    await SchemaModel.create(uploadSchema)
    await UserModel.create(testUser)
    const modelDoc: any = await ModelModel.create(testModel)
    testModel._id = modelDoc._id

    const deployment = {
      model: testModel._id,
      uuid: 'test',
      schemaRef: 'test',
    }
    await DeploymentModel.create(deployment)

    const testVersion: any = {
      model: testModel._id,
      version: '1',
      metadata: {},
      built: false,
      managerApproved: ApprovalStates.Accepted,
      reviewerApproved: ApprovalStates.NoResponse,
      state: {},
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await VersionModel.create(testVersion)
  })

  test('that we can fetch all models', async () => {
    const res = await authenticatedGetRequest('/api/v1/models?type=all&filter=')
    validateTestRequest(res)
    expect(res.body.models[0].uuid).toBe(testModel.uuid)
  })

  test('that we can fetch all model by UUID', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/uuid/${testModel.uuid}`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(testModel.uuid)
  })

  test('that we can fetch all model by id', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/id/${testModel._id}`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(testModel.uuid)
  })

  test('that we can fetch deployments for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${testModel.uuid}/deployments`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe('test')
  })

  test('that we can fetch schema for model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${testModel.uuid}/schema`)
    validateTestRequest(res)
    expect(res.body.reference).toBe('test-schema')
  })

  test('that we can fetch versions for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${testModel.uuid}/versions`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].version).toBe('1')
  })

  test('that we can fetch a specific version for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${testModel.uuid}/version/1`)
    validateTestRequest(res)
    expect(res.body).not.toBe(undefined)
    expect(res.body.version).toBe('1')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
