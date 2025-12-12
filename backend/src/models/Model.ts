import { model, Schema } from 'mongoose'

import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export const EntryVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type EntryVisibilityKeys = (typeof EntryVisibility)[keyof typeof EntryVisibility]

export const EntryKind = {
  Model: 'model',
  DataCard: 'data-card',
  MirroredModel: 'mirrored-model',
} as const

export type EntryKindKeys = (typeof EntryKind)[keyof typeof EntryKind]

export const SystemRoles = {
  Owner: 'owner',
  Contributor: 'contributor',
  Consumer: 'consumer',
  None: '',
} as const

export type SystemRolesKeys = (typeof SystemRoles)[keyof typeof SystemRoles]

export interface CollaboratorEntry {
  entity: string
  roles: Array<SystemRolesKeys | string>
}

export interface ModelMetadata {
  overview?: {
    [x: string]: unknown
  }

  // allow other properties
  [x: string]: unknown
}

export interface ModelCardInterface {
  schemaId: string
  version: number
  createdBy: string
  mirrored: boolean

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
  mirroredCard?: ModelCardInterface
  organisation: string
  state: string
  tags: string[]

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
      mirrored: { type: Boolean, default: false },

      metadata: { type: Schema.Types.Mixed },
    },
    mirroredCard: {
      schemaId: { type: String },
      version: { type: Number },
      createdBy: { type: String },
      mirrored: { type: Boolean, default: true },

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
    tags: [{ type: String }],

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

ModelSchema.plugin(softDeletionPlugin)
ModelSchema.index({ '$**': 'text' }, { weights: { name: 10, description: 5 } })

const ModelModel = model<ModelDoc>('v2_Model', ModelSchema)

export default ModelModel
