import { HydratedDocument, model, ObjectId, Schema, Types } from 'mongoose'

import { semverObjectToString, semverStringToObject } from '../utils/semver.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReleaseInterface {
  modelId: string
  modelCardVersion: number

  semver: SemverObject
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

export interface ReleaseVirtuals {
  semverString: string
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
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  ReleaseVirtuals
> &
  SoftDeleteDocument

export interface SemverObject {
  major: number
  minor: number
  patch: number
  metadata?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const ReleaseSchema = new Schema<ReleaseDoc, {}, {}, ReleaseVirtuals>(
  {
    modelId: { type: String, required: true },
    modelCardVersion: { type: Number, required: true },

    semver: {
      type: Schema.Types.Mixed,
      required: true,
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

ReleaseSchema.virtual('semverString').get(function () {
  return semverObjectToString(this.semver)
})
ReleaseSchema.virtual('semverString').set(function (semver: SemverObject | string) {
  if (typeof semver === 'string') {
    this.semver = semverStringToObject(semver)
  } else {
    this.semver = semver
  }
})

ReleaseSchema.plugin(softDeletionPlugin)
ReleaseSchema.index({ modelId: 1, semver: 1 }, { unique: true })
ReleaseSchema.index({ modelId: 1 })

const ReleaseModel = model<ReleaseDoc>('v2_Release', ReleaseSchema)

export default ReleaseModel
