/* eslint-disable import/newline-after-import */
import { clearStoredData } from '../utils/clear'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
;(async () => {
  await connectToMongoose()

  await clearStoredData()

  setTimeout(disconnectFromMongoose, 50)
})()
