/* eslint-disable import/newline-after-import */
import { findAndUpdateUser } from '../services/user'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
;(async () => {
  await connectToMongoose()

  // create users
  await findAndUpdateUser({
    userId: 'user',
    email: 'user@example.com',
    data: {
      special: 'data',
    },
  })

  setTimeout(disconnectFromMongoose, 50)
})()
