import { HydratedDocument, model, ObjectId, Schema, Types } from 'mongoose'

import { semverObjectToString, semverStringToObject } from '../services/release.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReleaseInterface {
  modelId: string
  modelCardVersion: number

  semver: string
  notes: string

  minor: boolean
  draft: boolean

  fileIds: Array<string>
  images: Array<ImageTagRef>

  deleted: boolean

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ImageNameRef {
  repository: string
  name: string
}
export interface ImageTagRef extends ImageNameRef {
  tag: string
}
export interface ImageDigestRef extends ImageNameRef {
  digest: string
}
export type ImageRef = ImageTagRef | ImageDigestRef

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReleaseDoc = HydratedDocument<
  Omit<ReleaseInterface, 'images'> & {
    images: Array<HydratedDocument<ImageTagRef>>
  }
> &
  SoftDeleteDocument

export interface SemverObject {
  major: number
  minor: number
  patch: number
  metadata?: string
}

const ReleaseSchema = new Schema<ReleaseDoc & { semver: string | SemverObject }>(
  {
    modelId: { type: String, required: true },
    modelCardVersion: { type: Number, required: true },

    semver: {
      type: Schema.Types.Mixed,
      required: true,
      set: function (semver: string) {
        return semverStringToObject(semver)
      },
      get: function (semver: SemverObject) {
        return semverObjectToString(semver)
      },
    },

    notes: { type: String, required: true },

    minor: { type: Boolean, required: true },
    draft: { type: Boolean, required: true },

    fileIds: [
      {
        type: Schema.Types.ObjectId,

        set: function (stringId: string) {
          return new Types.ObjectId(stringId)
        },
        get: function (objectId: ObjectId) {
          return objectId.toString()
        },
      },
    ],
    images: [
      {
        repository: { type: String },
        name: { type: String },
        tag: { type: String },
      },
    ],

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_releases',
    toJSON: { getters: true },
    toObject: { getters: true },
  },
)

ReleaseSchema.plugin(softDeletionPlugin)
ReleaseSchema.index({ modelId: 1, semver: 1 }, { unique: true })
ReleaseSchema.index({ modelId: 1 })

function convertSemverInFilter(filter: Record<string, any>) {
  if (filter.semver === undefined) {
    return
  }
  if (typeof filter.semver === 'string') {
    filter.semver = semverStringToObject(filter.semver)
  } else if (filter.semver !== null && typeof filter.semver === 'object' && '$in' in filter.semver) {
    filter.semver.$in = (filter.semver.$in as Array<string | SemverObject>).map((s) =>
      typeof s === 'string' ? semverStringToObject(s) : s,
    )
  }
}

// Querying by semver can be performed either with a string or a semver object this resolves the type to an object for database lookup
ReleaseSchema.pre(
  [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'updateOne',
    'updateMany',
    'replaceOne',
    'deleteOne',
    'deleteMany',
    'countDocuments',
  ],
  function () {
    convertSemverInFilter(this.getFilter())
  },
)

const ReleaseModel = model<ReleaseDoc>('v2_Release', ReleaseSchema)

export default ReleaseModel
