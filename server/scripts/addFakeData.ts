import { findUser } from '../utils/user';
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'

;(async () => {
  await connectToMongoose()

  // create users
  await findUser('user')

  setTimeout(disconnectFromMongoose, 50)
})()