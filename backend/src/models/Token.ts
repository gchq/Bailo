import bcrypt from 'bcryptjs'
import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export const TokenScope = {
  All: 'all',
  Models: 'models',
} as const

export type TokenScopeKeys = (typeof TokenScope)[keyof typeof TokenScope]

export const TokenActions = {
  ImageRead: 'image:read',
  FileRead: 'file:read',
} as const

export type TokenActionsKeys = (typeof TokenActions)[keyof typeof TokenActions]

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface TokenInterface {
  user: string
  description: string

  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<TokenActionsKeys>

  accessKey: string
  secretKey: string

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

  bcrypt.hash(this.secretKey, 8, (err: Error | undefined, hash: string) => {
    if (err) {
      next(err)
      return
    }

    this.secretKey = hash
    next()
  })
})

TokenSchema.methods.compareToken = function compareToken(candidateToken: string) {
  return new Promise((resolve, reject) => {
    if (!this.secretKey) {
      resolve(false)
      return
    }

    bcrypt.compare(candidateToken, this.secretKey, (err: Error | undefined, isMatch: boolean) => {
      if (err) {
        reject(err)
        return
      }
      resolve(isMatch)
    })
  })
}

TokenSchema.plugin(MongooseDelete, { overrideMethods: 'all' })

const TokenModel = model<TokenInterface>('v2_Token', TokenSchema)

export default TokenModel
