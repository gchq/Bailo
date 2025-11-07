import { Callback, CallbackWithoutResultAndOptionalError, ClientSession, Document, Schema, Types } from 'mongoose'

export interface SoftDeleteDocument extends Omit<Document, 'delete' | 'restore'>, SoftDeleteInterface {
  delete(session?: ClientSession | undefined, fn?: Callback<this>): Promise<this>
  restore(session?: ClientSession | undefined, fn?: Callback<this>): Promise<this>
}

export interface SoftDeleteInterface {
  deleted?: boolean | undefined
  deletedAt?: Date | undefined
  deletedBy?: Types.ObjectId | string | undefined
}

export function softDeletionPlugin(schema: Schema) {
  schema.add({ deleted: { type: Boolean, default: false } })
  schema.add({ deletedBy: { type: String, default: '' } })
  schema.add({ deletedAt: { type: String, default: '' } })

  schema.methods.delete = async function (session?: ClientSession | undefined, user?: string) {
    this.deleted = true
    this.deletedAt = new Date().toISOString()
    if (user) {
      this.deletedBy = user
    }
    return await this.save(session)
  }

  schema.methods.restore = async function (session: ClientSession | undefined) {
    this.deleted = false
    return await this.save(session)
  }

  schema.pre('find', function (next: CallbackWithoutResultAndOptionalError) {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
      next()
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
      next()
    }
  })

  schema.pre('findOne', function (next: CallbackWithoutResultAndOptionalError) {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
      next()
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
      next()
    }
  })

  schema.pre('aggregate', function (next: CallbackWithoutResultAndOptionalError) {
    this.pipeline().unshift({ $match: { deleted: { $ne: true } } })
    next()
  })
}
