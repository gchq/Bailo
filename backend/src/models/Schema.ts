import { model, Schema as MongooseSchema } from 'mongoose'

import { SchemaType } from '../types/types.js'

export interface Schema {
  name: string
  reference: string
  schema: any
  use: SchemaType
}

function getSchema(schema: string) {
  return JSON.parse(schema)
}

function setSchema(schema: unknown) {
  return JSON.stringify(schema)
}

const SchemaSchema = new MongooseSchema<Schema>(
  {
    name: { type: String, required: true, unique: true, index: true },
    reference: { type: String, required: true, unique: true },
    schema: {
      type: MongooseSchema.Types.Mixed,
      required: true,
      get: getSchema,
      set: setSchema,
    },
    use: { type: String, required: true, enum: [SchemaType.UPLOAD, SchemaType.DEPLOYMENT] },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
  },
)

const SchemaModel = model<Schema>('Schema', SchemaSchema)

export async function createSchemaIndexes() {
  await SchemaModel.createIndexes()
}

export default SchemaModel
