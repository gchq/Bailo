import { type MongooseDefaultQueryMiddleware, type Query, type Schema, type Types } from 'mongoose'

import { toEntrySearchGrams, touchesSearchFields } from '../../utils/search.js'

export interface SearchGramsOptions {
  // Document fields whose text, or array of text, is turned into searchGrams
  fields: readonly string[]
}

const queryUpdateMethods: MongooseDefaultQueryMiddleware[] = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
]

// Query middleware only gets the Query object, so affected ids are held per query until the post hook runs
type UpdateQuery = Query<unknown, unknown>
const pendingIds = new WeakMap<object, Types.ObjectId[]>()

/**
 * Keeps searchGrams in step with the configured fields for every write path, not just save().
 * Update operators only carry the changed fields, so affected ids are recorded before the write and
 * searchGrams is rebuilt from the stored documents afterwards.
 */
export function searchGramsPlugin(schema: Schema, { fields }: SearchGramsOptions) {
  const projection = Object.fromEntries([...fields, '_id'].map((field) => [field, 1]))

  // searchGrams is not selected by default, so always rebuild it rather than relying on isModified
  schema.pre('save', function searchGramsPreSave(this: Record<string, unknown>) {
    this.searchGrams = toEntrySearchGrams(this, fields)
  })

  schema.pre<UpdateQuery>(queryUpdateMethods, async function searchGramsPreUpdate() {
    // A replacement document can drop the search fields without naming them, so it always needs a rebuild
    if ((this as unknown as { op: string }).op !== 'replaceOne' && !touchesSearchFields(this.getUpdate(), fields)) {
      return
    }
    // Raw driver query so soft-deleted entries are included and no Mongoose middleware runs
    const docs = await this.model.collection
      .find(this.cast(this.model, { ...this.getFilter() }), {
        projection: { _id: 1 },
        session: this.getOptions().session ?? undefined,
      })
      .toArray()
    pendingIds.set(
      this,
      docs.map((doc) => doc._id),
    )
  })

  schema.post<UpdateQuery>(queryUpdateMethods, async function searchGramsPostUpdate(res: unknown) {
    if (!pendingIds.has(this)) {
      return
    }
    const ids = pendingIds.get(this) ?? []
    pendingIds.delete(this)
    // Upserts create documents the pre hook could not see: updateOne returns upsertedId, findOneAndUpdate returns the doc
    const result = res as { upsertedId?: Types.ObjectId; _id?: Types.ObjectId } | null
    if (result?.upsertedId) {
      ids.push(result.upsertedId)
    } else if (result?._id) {
      ids.push(result._id)
    }
    if (ids.length === 0) {
      return
    }

    const session = this.getOptions().session ?? undefined
    const docs = await this.model.collection.find({ _id: { $in: ids } }, { projection, session }).toArray()
    if (docs.length === 0) {
      return
    }
    // Raw driver write so this does not retrigger these hooks or bump updatedAt
    await this.model.collection.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { searchGrams: toEntrySearchGrams(doc, fields) } },
        },
      })),
      { session },
    )
  })

  schema.pre(
    'insertMany',
    function searchGramsPreInsertMany(docs: Record<string, unknown> | Record<string, unknown>[]) {
      for (const doc of Array.isArray(docs) ? docs : [docs]) {
        doc.searchGrams = toEntrySearchGrams(doc, fields)
      }
    },
  )

  schema.pre('bulkWrite', function searchGramsPreBulkWrite(ops) {
    for (const op of ops) {
      if ('insertOne' in op) {
        op.insertOne.document.searchGrams = toEntrySearchGrams(op.insertOne.document, fields)
      } else if ('replaceOne' in op) {
        op.replaceOne.replacement.searchGrams = toEntrySearchGrams(op.replaceOne.replacement, fields)
      } else if (
        ('updateOne' in op && touchesSearchFields(op.updateOne.update, fields)) ||
        ('updateMany' in op && touchesSearchFields(op.updateMany.update, fields))
      ) {
        // shortcut: bulkWrite hooks cannot see which documents an update matched, support it if a caller ever needs to
        throw new Error(`bulkWrite updates to ${fields.join(', ')} are not supported, use save or updateOne`)
      }
    }
  })
}
