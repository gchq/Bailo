import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'
import UserModel from '../../models/User'
import ModelModel from '../../models/Model'
import { ObjectId } from 'mongodb'
import DeploymentModel, { ApprovalStates } from '../../models/Deployment'
import SchemaModel from '../../models/Schema'
import VersionModel from '../../models/Version'

const request = supertest(server)

const testModel: any = {
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'test-model',
  currentMetadata: {},
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testVersion: any = {
  model: new ObjectId(),
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

const uploadSchema: any = {
  name: 'upload-schema',
  reference: 'test-schema',
  use: 'DEPLOYMENT',
  schema: {},
}

const testUser: any = {
  id: 'user',
  email: 'test',
}

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
    const res = await request.get('/api/v1/models?type=all&filter=').set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.models[0].uuid).toBe(testModel.uuid)
  })

  test('that we can fetch all model by UUID', async () => {
    const res = await request.get(`/api/v1/model/uuid/${testModel.uuid}`).set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.uuid).toBe(testModel.uuid)
  })

  test('that we can fetch all model by id', async () => {
    const res = await request.get(`/api/v1/model/id/${testModel._id}`).set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.uuid).toBe(testModel.uuid)
  })

  test('that we can fetch deployments for a model', async () => {
    const res = await request
      .get(`/api/v1/model/${testModel.uuid}/deployments`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe('test')
  })

  test('that we can fetch schema for model', async () => {
    const res = await request
      .get(`/api/v1/model/${testModel.uuid}/schema`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.reference).toBe('test-schema')
  })

  test('that we can fetch versions for a model', async () => {
    const res = await request
      .get(`/api/v1/model/${testModel.uuid}/versions`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].version).toBe('1')
  })

  test('that we can fetch a specific version for a model', async () => {
    const res = await request
      .get(`/api/v1/model/${testModel.uuid}/version/1`)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.version).toBe('1')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
