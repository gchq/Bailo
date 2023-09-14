import { createSchema } from '../services/schema.js'
import { SchemaType } from '../types/types.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import minimal from './example_schemas/minimal_upload_schema.json' assert { type: 'json' }
;(async () => {
  await connectToMongoose()

  await createSchema(
    {
      name: 'Minimal Schema v10',
      reference: '/Minimal/General/v10',
      schema: minimal,
      use: SchemaType.UPLOAD,
    },
    true,
  )

  setTimeout(disconnectFromMongoose, 50)
})()
