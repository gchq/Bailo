/* eslint-disable import/newline-after-import */
import { createSchema } from '../services/schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import minimal from './example_schemas/minimal_deployment_schema.json'
;(async () => {
  await connectToMongoose()

  await createSchema({
    name: 'Minimal Deployment Schema v6',
    reference: '/Minimal/Deployment/v6',
    schema: minimal,
    use: 'DEPLOYMENT',
  })

  setTimeout(disconnectFromMongoose, 50)
})()
