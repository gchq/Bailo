import { createSchema } from '../services/schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import deploy_schema from './example_schemas/minimal_deployment_schema.json'
import model_schema from './example_schemas/minimal_upload_schema.json'
;(async () => {
  await connectToMongoose()

  await createSchema(
    {
      name: 'Minimal Schema v10',
      reference: '/Minimal/General/v10',
      schema: model_schema,
      use: 'UPLOAD',
    },
    true
  )

  await createSchema({
    name: 'Minimal Deployment Schema v6',
    reference: '/Minimal/Deployment/v6',
    schema: deploy_schema,
    use: 'DEPLOYMENT',
  })

  setTimeout(disconnectFromMongoose, 50)
})()
