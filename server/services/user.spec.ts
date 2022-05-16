import '../utils/mockMongo'
import {
  findAndUpdateUser,
  getUserById,
  getUserByInternalId,
  serializedUserFields,
  findUsers,
  findUserCached,
} from './user'
import UserModel from '../models/User'

describe('test user service', () => {
  const testUser1 = {
    userId: 'user1',
    email: 'user1@email.com',
    data: { some: 'value' },
  }
  const testUser2 = {
    userId: 'user2',
    email: 'user2@email.com',
    data: { some: 'value' },
  }

  beforeEach(async () => {
    await findAndUpdateUser(testUser1)
    await findAndUpdateUser(testUser2)
  })

  test('can create test user', async () => {
    const user = await UserModel.findOne({ id: 'user1' })
    expect(user).toBeTruthy()
  })

  test('fetch user by ID and internal ID', async () => {
    const fetchedUser: any = await getUserById('user1')
    expect(fetchedUser).toBeTruthy()
    const fetchedUser2 = getUserByInternalId(fetchedUser._id)
    expect(fetchedUser2).toBeTruthy()
  })

  test('that we can find all users', async () => {
    const allUsers = await findUsers()
    expect(allUsers).toBeTruthy()
    expect(allUsers.length).toBe(2)
  })

  test('that the serializer returns the correct properties', () => {
    const properties = serializedUserFields()
    expect(properties.mandatory).toStrictEqual(['_id', 'id', 'email'])
  })

  test('that user is cached', async () => {
    const user: any = await findUserCached(testUser1)
    expect(user).toBeTruthy()
    expect(user.id).toBe(testUser1.userId)
  })
})
