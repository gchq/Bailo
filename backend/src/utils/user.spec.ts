import './mockMongo'

import { beforeEach, describe, expect, test } from 'vitest'

import UserModel from '../models/User.js'
import { testUser } from './test/testModels.js'
import { getUserFromAuthHeader } from './user.js'

describe('user utils', () => {
  beforeEach(async () => {
    await UserModel.create({
      ...testUser,
      token: 'password',
    })
  })

  test('that we can fetch a user from auth header', async () => {
    const authorisation = `BASIC ${Buffer.from('user:password').toString('base64')}`
    const { user } = await getUserFromAuthHeader(authorisation)
    expect(user).toBeDefined()
    expect(user.id).toBe(testUser.id)
  })

  test('that we get user from auth header fails correctly', async () => {
    const authorisation = `BASIC ${Buffer.from('bob:password').toString('base64')}`
    const { user, error } = await getUserFromAuthHeader(authorisation)
    expect(user).not.toBeDefined()
    expect(error).toBe('User not found')
  })
})
