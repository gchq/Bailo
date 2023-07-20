import { Document, model, Schema } from 'mongoose'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface SchemaInterface {
  id: string
  name: string

  inactive: boolean
  hidden: boolean

  use: UseTypeKeys
  display: string
  fields: Array<string>
  metadata: unknown

  createdAt: Date
  updatedAt: Date
}

export const UseType = {
  Model: 'model',
  Deployment: 'deployment',
} as const

export type UseTypeKeys = (typeof UseType)[keyof typeof UseType]

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelCardInterfaceDoc = SchemaInterface & Document<any, any, SchemaInterface>

const SchemaSchema = new Schema<SchemaInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },

    inactive: { type: Boolean, required: true, default: false },
    hidden: { type: Boolean, required: true, default: false },

    use: { type: String, enum: Object.values(UseType), required: true },
    display: { type: String, required: true },
    fields: [{ type: String, required: true }],
    metadata: { type: String, required: true, get: getSchema, set: setSchema },
  },
  {
    timestamps: true,
    collection: 'v2_schemas',
    toJSON: { getters: true },
  }
)

function getSchema(schema: string) {
  return JSON.parse(schema)
}

function setSchema(schema: unknown) {
  return JSON.stringify(schema)
}

const ModelCardModel = model<SchemaInterface>('v2_Model_Card', SchemaSchema)

export default ModelCardModel
