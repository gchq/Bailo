import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export const TokenScope = {
  All: 'all',
  Models: 'models',
} as const

export type TokenScopeKeys = (typeof TokenScope)[keyof typeof TokenScope]

export const TokenActions = {
  ModelRead: 'model:read',
  ModelWrite: 'model:write',

  ReleaseRead: 'release:read',
  ReleaseWrite: 'release:write',

  AccessRequestRead: 'access_request:read',
  AccessRequestWrite: 'access_request:write',

  FileRead: 'file:read',
  FileWrite: 'file:write',

  ImageRead: 'image:read',
  ImageWrite: 'image:write',

  SchemaRead: 'schema:read',
  SchemaWrite: 'schema:write',

  TokenRead: 'token:read',
  TokenWrite: 'token:write',
} as const

export type TokenActionsKeys = (typeof TokenActions)[keyof typeof TokenActions]

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
export type TokenDoc = TokenInterface & Document<any, any, TokenInterface>

const TokenSchema = new Schema<TokenInterface>(
  {
    user: { type: String, required: true },
    description: { type: String, required: true },

    scope: { type: String, enum: Object.values(TokenScope), required: true },
    modelIds: [{ type: String }],
    actions: [{ type: String, enum: Object.values(TokenActions) }],

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

TokenSchema.plugin(MongooseDelete, { overrideMethods: 'all' })

const TokenModel = model<TokenInterface>('v2_Token', TokenSchema)

export default TokenModel
