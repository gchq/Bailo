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

  setTimeout(disconnectFromMongoose, 50)
})()
