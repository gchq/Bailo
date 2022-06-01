import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'
import { findAndUpdateUser } from '../../services/user'
import RequestModel from '../../models/Request'
import * as requestService from '../../services/request'
import { ApprovalStates } from '../../models/Deployment'
import { ObjectId } from 'mongodb'

const request = supertest(server)

const testUser: any = {
  userId: 'user',
  email: 'user1@email.com',
  data: { some: 'value' },
}

const testRequest: any = {
  status: 'No Response',
  approvalType: 'Manager',
  request: 'Upload',
  version: null,
  __v: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testVersion: any = {
  model: new ObjectId(),
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

let requestDoc: any

describe('test requests routes', () => {
  beforeAll(async () => {
    const userDoc: any = await findAndUpdateUser(testUser)
    testUser._id = userDoc._id
    testRequest.user = userDoc._id
    requestDoc = await RequestModel.create(testRequest)
  })

  test('that we can fetch requests', async () => {
    const mock = jest.spyOn(requestService, 'readRequests')
    const requestArray: any = []
    requestArray.push(testRequest)
    mock.mockReturnValue(requestArray)
    const res = await request.get('/api/v1/requests?type=Upload').set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.requests.length).toBe(1)
  })

  test('that we can fetch requests count', async () => {
    const mock = jest.spyOn(requestService, 'readNumRequests')
    const mockedReturnCount: any = 1
    mock.mockReturnValue(mockedReturnCount)
    const res = await request.get('/api/v1/requests/count').set('x-userid', 'user').set('x-email', 'test')
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.count).toBe(1)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
