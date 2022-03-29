import SchemaModel from '../models/Schema'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'

import minimal from './example_schemas/minimal_upload_schema.json'
;(async () => {
  await connectToMongoose()

  const schema = new SchemaModel({
    name: 'Test Schema v5',
    reference: '/Test/General/v5',
    schema: minimal,
    use: 'UPLOAD',
  })

  await schema.save()

  setTimeout(disconnectFromMongoose, 50)
})()
