import mongoose from 'mongoose'
import '../../utils/mockMongo'
import { findAndUpdateUser } from '../../services/user'
import RequestModel from '../../models/Request'
import * as requestService from '../../services/request'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils'
import { testUser, testRequest } from '../../utils/test/testModels'

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
    const res = await authenticatedGetRequest('/api/v1/requests?type=Upload')
    validateTestRequest(res)
    expect(res.body.requests.length).toBe(1)
  })

  test('that we can fetch requests count', async () => {
    const mock = jest.spyOn(requestService, 'readNumRequests')
    const mockedReturnCount: any = 1
    mock.mockReturnValue(mockedReturnCount)
    const res = await authenticatedGetRequest('/api/v1/requests/count')
    validateTestRequest(res)
    expect(res.body.count).toBe(1)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
