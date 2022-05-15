import '../utils/mockMongo'
import { findAndUpdateUser } from './user'
import UserModel from '../models/User'

test('can create test user', async () => {
  await findAndUpdateUser({
    userId: 'user',
    email: 'user@email.com',
    data: { some: 'value' },
  })

  const user = await UserModel.findOne({ id: 'user' })
  expect(user).toBeTruthy()
})

test('database now empty', async () => {
  const user = await UserModel.find({})

  expect(user.length).toBe(0)
})
