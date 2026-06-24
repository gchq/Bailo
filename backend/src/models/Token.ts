import { HydratedDocument, model, Schema, Types } from 'mongoose'

import {
  createArgon2Hash,
  createBcryptHash,
  createSHA256Hash,
  HashType,
  HashTypeKeys,
  toSecretKey,
  verifyArgon2Hash,
  verifyBcryptHash,
  verifySHA256Hash,
} from '../services/hash.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export const TokenScope = {
  All: 'all',
  Models: 'models',
} as const

export type TokenScopeKeys = (typeof TokenScope)[keyof typeof TokenScope]

export const TokenActions = {
  ModelRead: { id: 'model:read', description: 'Grants access to view model/data card settings.' },
  ModelWrite: {
    id: 'model:write',
    description: 'Grants write access to creation and updating of model/data card settings.',
  },
  ModelExport: { id: 'model:export', description: 'Grants access to export model/data card settings.' },

  ReleaseRead: { id: 'release:read', description: 'Grants access to view releases.' },
  ReleaseWrite: { id: 'release:write', description: 'Grants access to create and update releases.' },
  ReleaseExport: { id: 'release:export', description: 'Grants access to export releases.' },

  AccessRequestRead: { id: 'access_request:read', description: 'Grant access to list access requests' },
  AccessRequestWrite: {
    id: 'access_request:write',
    description: 'Grants access to create, approve and comment on access requests.',
  },

  FileRead: { id: 'file:read', description: 'Grant access to download and view files.' },
  FileWrite: { id: 'file:write', description: 'Grant access to upload and delete files.' },

  ImageRead: { id: 'image:read', description: 'Grants access to pull and list images from a model repository.' },
  ImageWrite: { id: 'image:write', description: 'Grants access to push and delete images from a model repository.' },

  SchemaWrite: {
    id: 'schema:write',
    description: 'Grants permissions to upload and modify schemas for administrators.',
  },

  ReviewRoleWrite: {
    id: 'reviewRole:write',
    description: 'Grants permission to upload and modify review roles',
  },
  ReviewRoleRead: {
    id: 'reviewRole:read',
    description: 'Grants permission to view review roles',
  },
} as const

export const tokenActionIds = Object.values(TokenActions).map((tokenAction) => tokenAction.id)

export type TokenActionsKeys = (typeof TokenActions)[keyof typeof TokenActions]['id']

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface TokenInterface {
  _id: Types.ObjectId

  user: string
  description: string

  scope: TokenScopeKeys
  modelIds: Array<string>
  actions?: Array<TokenActionsKeys>

  accessKey: string
  secretKey: string
  hashMethod: HashTypeKeys

  deleted: boolean

  createdAt: Date
  updatedAt: Date

  compareToken: (candidateToken: string) => Promise<boolean>
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type TokenDoc = HydratedDocument<TokenInterface> & SoftDeleteDocument

const TokenSchema = new Schema<TokenDoc>(
  {
    user: { type: String, required: true },
    description: { type: String, required: true },

    scope: { type: String, enum: Object.values(TokenScope), required: true },
    modelIds: [{ type: String }],
    actions: [{ type: String, enum: tokenActionIds }],

    accessKey: { type: String, required: true, unique: true, index: true },
    secretKey: { type: String, required: true, select: false },
    hashMethod: { type: String, enum: Object.values(HashType), required: true, default: HashType.argon2 },
  },
  {
    timestamps: true,
    collection: 'v2_tokens',
  },
)

TokenSchema.pre('save', function userPreSave() {
  if (!this.isModified('secretKey') || !this.secretKey) {
    return
  }

  if (!this.hashMethod) {
    this.hashMethod = HashType.argon2
  }

  if (this.hashMethod === HashType.argon2) {
    const { salt, hash } = createArgon2Hash(this.secretKey)
    this.secretKey = toSecretKey(salt, hash)
  } else if (this.hashMethod === HashType.Bcrypt) {
    this.secretKey = createBcryptHash(this.secretKey)
  } else if (this.hashMethod === HashType.SHA256) {
    this.secretKey = createSHA256Hash(this.secretKey)
  } else {
    throw new Error('Unexpected hash type: ' + this.hashMethod)
  }
})

TokenSchema.methods.compareToken = function compareToken(candidateToken: string) {
  return new Promise((resolve) => {
    if (!this.secretKey) {
      resolve(false)
      return
    }

    if (this.hashMethod === HashType.argon2) {
      resolve(verifyArgon2Hash(candidateToken, this.secretKey))
    } else if (this.hashMethod === HashType.Bcrypt) {
      resolve(verifyBcryptHash(candidateToken, this.secretKey))
    } else if (this.hashMethod === HashType.SHA256) {
      resolve(verifySHA256Hash(candidateToken, this.secretKey))
    } else {
      throw new Error('Unexpected hash type: ' + this.hashMethod)
    }
  })
}

TokenSchema.plugin(softDeletionPlugin)

const TokenModel = model<TokenDoc>('v2_Token', TokenSchema)

export default TokenModel
