import SchemaModel from '../models/Schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'

import model_schema from './example_schemas/minimal_upload_schema.json'
import deploy_schema from './example_schemas/minimal_deployment_schema.json'

;(async () => {
  await connectToMongoose()
  
  await SchemaModel.deleteOne({name: 'Minimal Schema v10'})
  const modelSchema = new SchemaModel({
    name: 'Minimal Schema v10',
    reference: '/Minimal/General/v10',
    schema: model_schema,
    use: 'UPLOAD',
  })

  await modelSchema.save()
  
  await SchemaModel.deleteOne({name: 'Minimal Deployment Schema v6'})
  const depSchema = new SchemaModel({
    name: 'Minimal Deployment Schema v6',
    reference: '/Minimal/Deployment/v6',
    schema: deploy_schema,
    use: 'DEPLOYMENT',
  })

  await depSchema.save()

  setTimeout(disconnectFromMongoose, 50)
})()
