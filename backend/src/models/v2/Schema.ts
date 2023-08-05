import { Document, model, Schema } from 'mongoose'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface SchemaInterface {
  id: string
  name: string
  description: string

  active: boolean
  hidden: boolean

  kind: SchemaKindKeys
  meta: unknown

  uiSchema: unknown
  schema: unknown

  createdAt: Date
  updatedAt: Date
}

export const SchemaKind = {
  Model: 'model',
  Deployment: 'deployment',
} as const

export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelCardInterfaceDoc = SchemaInterface & Document<any, any, SchemaInterface>

const SchemaSchema = new Schema<SchemaInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: false, default: '' },

    active: { type: Boolean, required: true, default: true },
    hidden: { type: Boolean, required: true, default: false },

    kind: { type: String, enum: Object.values(SchemaKind), required: true },
    meta: { type: String, required: true, get: getSchema, set: setSchema },

    uiSchema: { type: String, required: true, get: getSchema, set: setSchema },
    schema: { type: String, required: true, get: getSchema, set: setSchema },
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

const ModelCardModel = model<SchemaInterface>('v2_Schema', SchemaSchema)

export default ModelCardModel
