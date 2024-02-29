import '../../utils/mockMongo'

import { ObjectId } from 'mongodb'
import mongoose, { Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

import ModelModel from '../../models/Model.js'
import UserModel from '../../models/User.js'
import * as userService from '../../services/user.js'
import { testUser, userDoc } from '../../utils/test/testModels.js'
import { authenticatedGetRequest, authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils.js'

const modelId = new Types.ObjectId()

const localTestUser: any = {
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

describe('test user routes', () => {
  beforeEach(async () => {
    await userService.findAndUpdateUser(localTestUser)
    await ModelModel.create(testModel)
  })

  test('that we can fetch the correct UI config', async () => {
    vi.spyOn(userService, 'findUsers').mockResolvedValueOnce([testUser])
    const res = await authenticatedGetRequest('/api/v1/users')
    const data = JSON.parse(res.text)
    validateTestRequest(res)
    expect(data.users.length).toBe(1)
    expect(data.users[0].id).toBe('user')
  })

  test('that we can get the logged in user', async () => {
    vi.spyOn(userService, 'getUserByInternalId').mockReturnValue(testUser)
    const res = await authenticatedGetRequest('/api/v1/user')
    validateTestRequest(res)
    expect(res.body.id).toBe(testUser.id)
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
    const user2Doc = new UserModel(testUser2)
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce(user2Doc)

    const res = await authenticatedPostRequest(`/api/v1/user/favourite/${modelId}`)
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
    const user2Doc = new UserModel(testUser2)
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce(user2Doc)

    const res = await authenticatedPostRequest(`/api/v1/user/unfavourite/${modelId}`)
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(0)
  })

  test('that unfavourite a model where the model is not favourited', async () => {
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce(userDoc)
    const res = await authenticatedPostRequest(`/api/v1/user/unfavourite/${modelId}`)
    validateTestRequest(res)
    expect(res.body.favourites.length).toBe(0)
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})
