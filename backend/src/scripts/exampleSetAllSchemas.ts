import { createSchema } from '../services/schema.js'
import { SchemaType } from '../types/types.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import deploySchema from './example_schemas/minimal_deployment_schema.json' assert { type: 'json' }
import modelSchema from './example_schemas/minimal_upload_schema.json' assert { type: 'json' }
;(async () => {
  await connectToMongoose()

  await createSchema(
    {
      name: 'Minimal Schema v10',
      reference: '/Minimal/General/v10',
      schema: modelSchema,
      use: SchemaType.UPLOAD,
    },
    true,
  )

  await createSchema(
    {
      name: 'Minimal Deployment Schema v6',
      reference: '/Minimal/Deployment/v6',
      schema: deploySchema,
      use: SchemaType.DEPLOYMENT,
    },
    true,
  )

  setTimeout(disconnectFromMongoose, 50)
})()
