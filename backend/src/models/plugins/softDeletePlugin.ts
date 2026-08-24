import { Callback, ClientSession, Document, PipelineStage, Schema, Types } from 'mongoose'

export interface SoftDeleteDocument extends Omit<Document, 'delete' | 'restore'>, SoftDeleteInterface {
  delete(session?: ClientSession, fn?: Callback<this>): Promise<this>
  restore(session?: ClientSession, fn?: Callback<this>): Promise<this>
}

export interface SoftDeleteInterface {
  deleted?: boolean | undefined
  deletedAt?: Date | undefined
  deletedBy?: Types.ObjectId | string | undefined
}

/**
 * Converts a simple-form $lookup into pipeline form so a soft-delete
 * filter can be injected into the joined collection's query.
 *
 * Simple-form $lookup operates at the MongoDB driver level and bypasses
 * Mongoose middleware, so deleted documents in the target collection
 * would be returned without this rewrite.
 */
function rewriteLookupWithSoftDelete(lookup: Record<string, any>): PipelineStage {
  const { from, localField, foreignField, as: alias } = lookup
  return {
    $lookup: {
      from,
      let: { joinValue: `$${localField}` },
      pipeline: [
        {
          $match: {
            $expr: { $eq: [`$${foreignField}`, '$$joinValue'] },
            deleted: { $ne: true },
          },
        },
      ],
      as: alias,
    },
  }
}

/**
 * Scans an aggregation pipeline for $lookup stages and ensures each
 * one excludes soft-deleted documents from the joined collection.
 */
function addSoftDeleteFilterToLookups(pipeline: PipelineStage[]): void {
  for (let i = 0; i < pipeline.length; i++) {
    const stage = pipeline[i] as Record<string, any>
    if (!stage.$lookup) {
      continue
    }

    if (stage.$lookup.pipeline) {
      stage.$lookup.pipeline.unshift({ $match: { deleted: { $ne: true } } })
    } else if (stage.$lookup.localField && stage.$lookup.foreignField) {
      pipeline[i] = rewriteLookupWithSoftDelete(stage.$lookup)
    }
  }
}

export function softDeletionPlugin(schema: Schema) {
  schema.add({ deleted: { type: Boolean, default: false } })
  schema.add({ deletedBy: { type: String, default: '' } })
  schema.add({ deletedAt: { type: String, default: '' } })

  schema.methods.delete = async function (session?: ClientSession, user?: string) {
    this.deleted = true
    this.deletedAt = new Date().toISOString()
    if (user) {
      this.deletedBy = user
    }
    return await this.save({ session })
  }

  schema.statics.deleteOne = async function (filter: Record<string, any>, session?: ClientSession, user?: string) {
    const update: Record<string, any> = {
      deleted: true,
      deletedAt: new Date().toISOString(),
    }
    if (user) {
      update.deletedBy = user
    }

    return this.updateOne(filter, update, { session })
  }

  schema.statics.deleteMany = async function (filter: Record<string, any>, session?: ClientSession, user?: string) {
    const update: Record<string, any> = {
      deleted: true,
      deletedAt: new Date().toISOString(),
    }
    if (user) {
      update.deletedBy = user
    }

    return this.updateMany(filter, update, { session })
  }

  schema.statics.findByIdAndDelete = async function (
    id: Types.ObjectId | string,
    session?: ClientSession,
    user?: string,
  ) {
    const update: Record<string, any> = {
      deleted: true,
      deletedAt: new Date().toISOString(),
    }
    if (user) {
      update.deletedBy = user
    }

    const options: Record<string, any> = { new: true }
    if (session) {
      options.session = session
    }

    return this.findByIdAndUpdate(id, update, options)
  }

  schema.statics.findOneAndDelete = async function (
    filter: Record<string, any>,
    session?: ClientSession,
    user?: string,
  ) {
    const update: Record<string, any> = {
      deleted: true,
      deletedAt: new Date().toISOString(),
    }
    if (user) {
      update.deletedBy = user
    }

    const options: Record<string, any> = { new: true }
    if (session) {
      options.session = session
    }

    return this.findOneAndUpdate(filter, update, options)
  }

  schema.methods.restore = async function (session: ClientSession | undefined) {
    this.deleted = false
    return await this.save({ session })
  }

  schema.pre('find', function () {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
    }
  })

  schema.pre('findOne', function () {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
    }
  })

  schema.pre('aggregate', function () {
    const pipeline = this.pipeline()
    pipeline.unshift({ $match: { deleted: { $ne: true } } })
    addSoftDeleteFilterToLookups(pipeline)
  })

  schema.pre('countDocuments', function () {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
    }
  })

  schema.pre('distinct', function () {
    if (this['_conditions'].deleted) {
      this.where('deleted').equals(this['_conditions'].deleted)
    } else {
      this.or([{ deleted: { $exists: false } }, { deleted: false }])
    }
  })
}
