import { jest } from '@jest/globals'
import { ObjectId } from 'mongodb'
import mongoose, { Types } from 'mongoose'
import supertest from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { server } from '../../routes.js'
import ModelModel from '../../models/Model.js'
import UserModel from '../../models/User.js'
import '../../utils/mockMongo'

const user = await import('../../services/user.js')
jest.unstable_mockModule('../../services/user.js', () => ({
  ...user,
  getUserByInternalId: jest.fn(),
}))

const { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } = await import(
  '../../utils/test/testUtils.js'
)
const { getUserByInternalId, findAndUpdateUser } = await import('../../services/user.js')

const request = supertest(server)

const modelId = new Types.ObjectId()

const testUser: any = {
  userId: 'user',
  email: 'user@email.com',
  data: { some: 'value' },
  token: uuidv4(),
}

const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test',
  latestVersion: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

let userDoc: any

describe('test user routes', () => {
  beforeEach(async () => {
    userDoc = await findAndUpdateUser(testUser)
    await ModelModel.create(testModel)
  })

  test('that we can fetch the correct UI config', async () => {
    const res = await authenticatedGetRequest('/api/v1/users')
    const data = JSON.parse(res.text)
    validateTestRequest(res)
    expect(data.users.length).toBe(1)
    expect(data.users[0].id).toBe('user')
  })

  test('that we can get the logged in user', async () => {
    ;(getUserByInternalId as unknown as jest.Mock).mockReturnValue(userDoc)
    const res = await authenticatedGetRequest('/api/v1/user')
    validateTestRequest(res)
    expect(res.body.id).toBe(testUser.userId)
  })

  test('that we can favourite a model', async () => {
    const res = await authenticatedPostRequest(`/api/v1/user/favourite/${modelId}`)
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(1)
    expect(res.body.favourites[0]).toBe(modelId.toString())
  })

  test('that favouriting a model that is not favourited already', async () => {
    const testUser2: any = {
      id: 'user2',
      email: 'user2@email.com',
      data: { some: 'value' },
      token: uuidv4(),
      favourites: [],
    }
    testUser2.favourites.push(modelId)
    await UserModel.create(testUser2)
    const res = await request.post(`/api/v1/user/favourite/${modelId}`).set('x-userid', 'user2').set('x-email', 'test')
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(1)
    expect(res.body.favourites[0]).toBe(modelId.toString())
  })

  test('that we can unfavourite a model', async () => {
    const testUser2: any = {
      id: 'user2',
      email: 'user2@email.com',
      data: { some: 'value' },
      token: uuidv4(),
      favourites: [],
    }
    testUser2.favourites.push(modelId)
    await UserModel.create(testUser2)
    const res = await request
      .post(`/api/v1/user/unfavourite/${modelId}`)
      .set('x-userid', 'user2')
      .set('x-email', 'test')
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(0)
  })

  test('that unfavourite a model where the model is not favourited', async () => {
    const res = await authenticatedPostRequest(`/api/v1/user/unfavourite/${modelId}`)
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(0)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
