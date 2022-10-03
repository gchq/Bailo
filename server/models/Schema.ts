import { model, Schema as MongooseSchema } from 'mongoose'

export interface Schema {
  name: string
  reference: string
  schema: any
  use: string
}

function getSchema(schema) {
  return JSON.parse(schema)
}

function setSchema(schema) {
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
    use: { type: String, required: true, enum: ['UPLOAD', 'DEPLOYMENT'] },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
  }
)

const SchemaModel = model<Schema>('Schema', SchemaSchema)
SchemaModel.createIndexes()

export default SchemaModel
