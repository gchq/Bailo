/* eslint-disable import/newline-after-import */
import { createSchema } from '../services/schema.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import deploySchema from './example_schemas/minimal_deployment_schema.json.js'
import modelSchema from './example_schemas/minimal_upload_schema.json.js'
;(async () => {
  await connectToMongoose()

  await createSchema(
    {
      name: 'Minimal Schema v10',
      reference: '/Minimal/General/v10',
      schema: modelSchema,
      use: 'UPLOAD',
    },
    true
  )

  await createSchema(
    {
      name: 'Minimal Deployment Schema v6',
      reference: '/Minimal/Deployment/v6',
      schema: deploySchema,
      use: 'DEPLOYMENT',
    },
    true
  )

  setTimeout(disconnectFromMongoose, 50)
})()
