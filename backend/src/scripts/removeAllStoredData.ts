import { clearStoredData } from '../utils/clear.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
;(async () => {
  await connectToMongoose()

  await clearStoredData()

  setTimeout(disconnectFromMongoose, 50)
})()
