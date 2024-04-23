import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export const EntryVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type EntryVisibilityKeys = (typeof EntryVisibility)[keyof typeof EntryVisibility]

export const EntryKind = {
  Model: 'model',
  DataCard: 'data-card',
} as const

export type EntryKindKeys = (typeof EntryKind)[keyof typeof EntryKind]

export interface CollaboratorEntry {
  entity: string
  roles: Array<'owner' | 'contributor' | 'consumer' | string>
}

export interface ModelMetadata {
  overview?: {
    tags: Array<string>
    [x: string]: unknown
  }

  // allow other properties
  [x: string]: unknown
}

export interface ModelCardInterface {
  schemaId: string
  version: number
  createdBy: string

  metadata: ModelMetadata
}

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ModelInterface {
  id: string

  name: string
  kind: EntryKindKeys
  teamId?: string
  description: string
  card?: ModelCardInterface

  collaborators: Array<CollaboratorEntry>
  settings: {
    ungovernedAccess: boolean
  }

  visibility: EntryVisibilityKeys
  deleted: boolean

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelDoc = ModelInterface & Document<any, any, ModelInterface>

const ModelSchema = new Schema<ModelInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    teamId: { type: String, required: true, index: true, default: 'Uncategorised' },

    name: { type: String, required: true },
    kind: { type: String, enum: Object.values(EntryKind) },
    description: { type: String, required: true },
    card: {
      schemaId: { type: String },
      version: { type: Number },
      createdBy: { type: String },

      metadata: { type: Schema.Types.Mixed },
    },

    collaborators: [
      {
        entity: { type: String, required: true },
        roles: [{ type: String }],
      },
    ],
    settings: {
      ungovernedAccess: { type: Boolean, required: true, default: false },
    },

    visibility: { type: String, enum: Object.values(EntryVisibility), default: EntryVisibility.Public },
  },
  {
    timestamps: true,
    collection: 'v2_models',
  },
)

ModelSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })
ModelSchema.index({ '$**': 'text' }, { weights: { name: 10, description: 5 } })

const ModelModel = model<ModelInterface>('v2_Model', ModelSchema)

export default ModelModel
