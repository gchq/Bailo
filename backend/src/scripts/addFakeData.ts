import { findAndUpdateUser } from '../services/user.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
;(async () => {
  await connectToMongoose()

  // create users
  await findAndUpdateUser({
    userId: 'user',
    email: 'user@example.com',
    data: {
      special: 'data',
    },
    roles: ['user', 'admin'],
  })

  // create users
  await findAndUpdateUser({
    userId: 'user2',
    email: 'user2@example.com',
    data: {
      special: 'data',
    },
    roles: ['user'],
  })

  setTimeout(disconnectFromMongoose, 50)
})()
