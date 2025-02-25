import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

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

export interface Settings {
  ungovernedAccess: boolean
  allowTemplating: boolean
  mirror: { sourceModelId?: string; destinationModelId?: string }
}

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ModelInterface {
  id: string

  name: string
  kind: EntryKindKeys
  description: string
  card?: ModelCardInterface
  organisation: string
  state: string

  collaborators: Array<CollaboratorEntry>
  settings: Settings

  visibility: EntryVisibilityKeys
  deleted: boolean

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelDoc = ModelInterface & SoftDeleteDocument

const ModelSchema = new Schema<ModelDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },
    kind: { type: String, enum: Object.values(EntryKind) },
    description: { type: String, required: true },
    card: {
      schemaId: { type: String },
      version: { type: Number },
      createdBy: { type: String },

      metadata: { type: Schema.Types.Mixed },
    },
    organisation: {
      type: String,
      required: function () {
        return typeof this['organisation'] === 'string' ? false : true
      },
      default: '',
    },
    state: {
      type: String,
      required: function () {
        return typeof this['state'] === 'string' ? false : true
      },
      default: '',
    },

    collaborators: [
      {
        entity: { type: String, required: true },
        roles: [{ type: String }],
      },
    ],
    settings: {
      ungovernedAccess: { type: Boolean, required: true, default: false },
      allowTemplating: { type: Boolean, required: true, default: false },
      mirror: { sourceModelId: { type: String }, destinationModelId: { type: String } },
    },

    visibility: { type: String, enum: Object.values(EntryVisibility), default: EntryVisibility.Public },
  },
  {
    timestamps: true,
    collection: 'v2_models',
  },
)

ModelSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
  deletedAt: true,
})
ModelSchema.index({ '$**': 'text' }, { weights: { name: 10, description: 5 } })

const ModelModel = model<ModelDoc>('v2_Model', ModelSchema)

export default ModelModel
