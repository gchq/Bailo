import { createSchema } from '../services/schema.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import minimal from './example_schemas/minimal_deployment_schema.json' assert { type: 'json' }
;(async () => {
  await connectToMongoose()

  await createSchema(
    {
      name: 'Minimal Deployment Schema v6',
      reference: '/Minimal/Deployment/v6',
      schema: minimal,
      use: 'DEPLOYMENT',
    },
    true
  )

  setTimeout(disconnectFromMongoose, 50)
})()
