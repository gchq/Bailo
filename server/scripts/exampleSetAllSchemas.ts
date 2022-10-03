/* eslint-disable import/newline-after-import */
import { createSchema } from '../services/schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import deploySchema from './example_schemas/minimal_deployment_schema.json'
import modelSchema from './example_schemas/minimal_upload_schema.json'
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

  await createSchema({
    name: 'Minimal Deployment Schema v6',
    reference: '/Minimal/Deployment/v6',
    schema: deploySchema,
    use: 'DEPLOYMENT',
  })

  setTimeout(disconnectFromMongoose, 50)
})()
