import { findUser } from '../utils/user'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
;(async () => {
  await connectToMongoose()

  // login as user

  setTimeout(disconnectFromMongoose, 50)
})()
