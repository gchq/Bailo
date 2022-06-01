import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'
import { ApprovalStates } from '../../models/Deployment'
import { ObjectId } from 'mongodb'
import VersionModel from '../../models/Version'
import UserModel from '../../models/User'
import * as requestService from '../../services/request'

const request = supertest(server)

const modelId = new ObjectId()

const testVersion: any = {
  model: modelId,
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

const testManager: any = {
  id: 'manager',
  email: 'user',
  data: { some: 'value' },
}

const testReviewer: any = {
  id: 'reviewer',
  email: 'user',
  data: { some: 'value' },
}

describe('test version routes', () => {
  beforeEach(async () => {
    await UserModel.create(testManager)
    await UserModel.create(testReviewer)
    const versionDoc = await VersionModel.create(testVersion)
    testVersion._id = versionDoc._id
  })

  test('that we can fetch a version by its ID', async () => {
    const res = await request
      .get('/api/v1/version/' + testVersion._id)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.version).toBe('1')
  })

  test('that we can edit a version', async () => {
    const mock: any = jest.spyOn(requestService, 'createVersionRequests')
    const editedVersion = testVersion
    editedVersion.metadata.highLevelDetails.name = 'test2'
    mock.mockReturnValue({})
    const res = await request
      .put('/api/v1/version/' + testVersion._id)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(editedVersion.metadata)
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.metadata.highLevelDetails.name).toBe('test2')
  })

  test('that we can reset approvals for a version', async () => {
    const res = await request
      .post(`/api/v1/version/${testVersion._id}/reset-approvals`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('x-userid', 'user')
      .set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toBe(undefined)
    expect(res.body.managerApproved).toBe('No Response')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
