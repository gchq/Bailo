import SchemaModel from '../models/Schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'

import minimal from './example_schemas/minimal_deployment_schema.json'
;(async () => {
  await connectToMongoose()

  const schema = new SchemaModel({
    name: 'Minimal Deployment Schema v6',
    reference: '/Minimal/Deployment/v6',
    schema: minimal,
    use: 'DEPLOYMENT',
  })

  await schema.save()

  setTimeout(disconnectFromMongoose, 50)
})()
