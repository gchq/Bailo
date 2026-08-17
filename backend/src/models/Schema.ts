import { Schema as JsonSchema } from 'jsonschema'
import { Document, HydratedDocument, model, Schema } from 'mongoose'

import { SchemaKind, SchemaKindKeys } from '../types/enums.js'

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
  jsonSchema: JsonSchema

  reviewRoles: string[]

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type SchemaDoc = HydratedDocument<SchemaInterface> & Document<any, any, SchemaInterface>

const SchemaSchema = new Schema<SchemaInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: false, default: '' },

    active: { type: Boolean, default: true },
    hidden: { type: Boolean, default: false },

    kind: { type: String, enum: Object.values(SchemaKind), required: true },
    jsonSchema: { type: String, required: true, get: getSchema, set: setSchema },

    reviewRoles: [{ type: String }],
  },
  {
    timestamps: true,
    collection: 'v2_schemas',
    toJSON: { getters: true },
  },
)

function getSchema(schema: string) {
  return JSON.parse(schema)
}

function setSchema(schema: unknown) {
  return JSON.stringify(schema)
}

// SchemaSchema.virtual('jsonSchema').get(function () {
//   if (this.kind === SchemaKind.DeploymentAssessment) {
//     const updatedProperties = {
//       overview: {
//         title: 'Details',
//         type: 'object',
//         properties: {
//           name: {
//             title: 'What is the name of the deployment assessment?',
//             description: 'This will be used to distinguish your deployment assessment.',
//             type: 'string',
//           },
//           riskOwner: {
//             title: 'Who is the risk owner attached to this deployment assessment?',
//             type: 'string',
//             widget: 'entitySelector',
//           },
//           riskOwnerJustification: {
//             title: 'Justify why the risk owner has been assigned',
//             type: 'string',
//           },
//           entryList: {
//             title: 'List all models assigned to this deployment assessment',
//             type: 'array',
//             items: {
//               type: 'string',
//             },
//             minItems: 1,
//             widget: 'modelSelector',
//           },
//         },
//         required: ['name', 'riskOwner', 'entryList'],
//         additionalProperties: false,
//       },
//       ...this.jsonSchema.properties,
//     }
//     return updatedProperties
//   }
// })

const SchemaModel = model<SchemaInterface>('v2_Schema', SchemaSchema)

export default SchemaModel
