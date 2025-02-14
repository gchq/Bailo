import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

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
  ReleaseRead: { id: 'release:read', description: 'Grants access to view releases.' },
  ReleaseWrite: { id: 'release:write', description: 'Grants access to create and update releases.' },

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
} as const

export const tokenActionIds = Object.values(TokenActions).map((tokenAction) => tokenAction.id)

export type TokenActionsKeys = (typeof TokenActions)[keyof typeof TokenActions]['id']

export const HashType = {
  Bcrypt: 'bcrypt',
  SHA256: 'sha-256',
}

export type HashTypeKeys = (typeof HashType)[keyof typeof HashType]

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface TokenInterface {
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
export type TokenDoc = TokenInterface & SoftDeleteDocument

const TokenSchema = new Schema<TokenDoc>(
  {
    user: { type: String, required: true },
    description: { type: String, required: true },

    scope: { type: String, enum: Object.values(TokenScope), required: true },
    modelIds: [{ type: String }],
    actions: [{ type: String, enum: tokenActionIds }],

    accessKey: { type: String, required: true, unique: true, index: true },
    secretKey: { type: String, required: true, select: false },
    hashMethod: { type: String, enum: Object.values(HashType), required: true, default: HashType.SHA256 },
  },
  {
    timestamps: true,
    collection: 'v2_tokens',
  },
)

TokenSchema.pre('save', function userPreSave(next) {
  if (!this.isModified('secretKey') || !this.secretKey) {
    next()
    return
  }

  if (!this.hashMethod) {
    this.hashMethod = HashType.SHA256
  }

  if (this.hashMethod === HashType.Bcrypt) {
    bcrypt.hash(this.secretKey, 8, (err: Error | null, hash: string) => {
      if (err) {
        next(err)
        return
      }

      this.secretKey = hash
      next()
    })
  } else if (this.hashMethod === HashType.SHA256) {
    const hash = createHash('sha256').update(this.secretKey).digest('hex')
    this.secretKey = hash
    next()
  } else {
    throw new Error('Unexpected hash type: ' + this.hashMethod)
  }
})

TokenSchema.methods.compareToken = function compareToken(candidateToken: string) {
  return new Promise((resolve, reject) => {
    if (!this.secretKey) {
      resolve(false)
      return
    }

    if (this.hashMethod === HashType.Bcrypt) {
      bcrypt.compare(candidateToken, this.secretKey, (err: Error | null, isMatch: boolean) => {
        if (err) {
          reject(err)
          return
        }
        resolve(isMatch)
      })
    } else if (this.hashMethod === HashType.SHA256) {
      const candidateHash = createHash('sha256').update(candidateToken).digest('hex')
      if (candidateHash !== this.secretKey) {
        resolve(false)
        return
      }

      resolve(true)
    } else {
      throw new Error('Unexpected hash type: ' + this.hashMethod)
    }
  })
}

TokenSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedAt: true })

const TokenModel = model<TokenDoc>('v2_Token', TokenSchema)

export default TokenModel
