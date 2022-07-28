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

const testUser = {
  userId: 'user',
  email: 'user@email.com',
  data: { some: 'value' },
}
const testUser2 = {
  userId: 'user2',
  email: 'user2@email.com',
  data: { some: 'value' },
}

describe('test user service', () => {
  beforeEach(async () => {
    await findAndUpdateUser(testUser)
    await findAndUpdateUser(testUser2)
  })

  test('can create test user', async () => {
    const user = await UserModel.findOne({ id: 'user' })
    expect(user).toBeTruthy()
  })

  test('fetch user by ID and internal ID', async () => {
    const fetchedUser: any = await getUserById('user')
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
    const user: any = await findUserCached(testUser)
    expect(user).toBeTruthy()
    expect(user.id).toBe(testUser.userId)
  })
})
