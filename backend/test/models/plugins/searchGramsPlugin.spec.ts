import mongoose from 'mongoose'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { searchGramsPlugin } from '../../../src/models/plugins/searchGramsPlugin.js'
import { toSearchGrams } from '../../../src/utils/search.js'

const fields = ['name', 'description', 'tags']

function getHooks(schema: mongoose.Schema, kind: '_pres' | '_posts', hookName: string): Array<(...args: any[]) => any> {
  const hooks = (schema as any).s.hooks[kind]
  const found = hooks instanceof Map ? hooks.get(hookName) : hooks?.[hookName]
  return found ? found.map((h: any) => h.fn) : []
}

function createQuery(op: string, update: unknown) {
  const toArray = vi.fn()
  const find = vi.fn(() => ({ toArray }))
  const bulkWrite = vi.fn()
  const query = {
    op,
    getUpdate: () => update,
    getFilter: () => ({ id: 'a' }),
    getOptions: () => ({}),
    cast: (_model: unknown, filter: unknown) => filter,
    model: { collection: { find, bulkWrite } },
  }
  return { query, toArray, find, bulkWrite }
}

async function runUpdate(query: any, res?: unknown) {
  await getHooks(schema, '_pres', query.op)[0].call(query)
  await getHooks(schema, '_posts', query.op)[0].call(query, res)
}

let schema: mongoose.Schema

describe('models > plugins > searchGramsPlugin', () => {
  beforeEach(() => {
    schema = new mongoose.Schema({ name: String, description: String, tags: [String], searchGrams: [String] })
    schema.plugin(searchGramsPlugin, { fields })
  })

  describe('save', () => {
    let Test: mongoose.Model<any>

    const saveHook = () => getHooks(schema, '_pres', 'save').find((hook) => hook.name === 'searchGramsPreSave')!

    beforeEach(() => {
      Test = new mongoose.Mongoose().model('SearchGramsTest', schema)
    })

    test('rebuilds searchGrams from the configured fields', async () => {
      const doc = new Test({ name: 'Yolo', description: 'detects', tags: ['cat'] })

      await saveHook().call(doc)

      expect(doc.searchGrams).toEqual(toSearchGrams('Yolo', 'detects', 'cat'))
    })

    test('reads fields excluded by a projection from the stored document', async () => {
      const doc = Test.hydrate({ _id: new mongoose.Types.ObjectId(), name: 'Yolo' }, { name: 1 })
      const findOne = vi.spyOn(doc.collection, 'findOne').mockResolvedValue({ description: 'detects', tags: ['cat'] })

      await saveHook().call(doc)

      expect(findOne).toHaveBeenCalledWith(
        { _id: doc._id },
        expect.objectContaining({ projection: { description: 1, tags: 1 } }),
      )
      expect(doc.searchGrams).toEqual(toSearchGrams('Yolo', 'detects', 'cat'))
    })
  })

  test('insertMany > sets searchGrams on every document', () => {
    const docs: Record<string, unknown>[] = [{ name: 'Yolo' }, { name: 'Bert', tags: ['nlp'] }]

    getHooks(schema, '_pres', 'insertMany')[0].call({}, docs)

    expect(docs[0].searchGrams).toEqual(toSearchGrams('Yolo'))
    expect(docs[1].searchGrams).toEqual(toSearchGrams('Bert', 'nlp'))
  })

  describe('bulkWrite', () => {
    test('sets searchGrams on inserted and replaced documents', () => {
      const ops: any[] = [
        { insertOne: { document: { name: 'Yolo' } } },
        { replaceOne: { replacement: { name: 'Bert' } } },
      ]

      getHooks(schema, '_pres', 'bulkWrite')[0].call({}, ops)

      expect(ops[0].insertOne.document.searchGrams).toEqual(toSearchGrams('Yolo'))
      expect(ops[1].replaceOne.replacement.searchGrams).toEqual(toSearchGrams('Bert'))
    })

    test('rejects updates to the search fields', () => {
      const hook = getHooks(schema, '_pres', 'bulkWrite')[0]

      expect(() => hook.call({}, [{ updateOne: { update: { $set: { name: 'a' } } } }])).toThrow(/not supported/)
      expect(() => hook.call({}, [{ updateMany: { update: { $push: { tags: 'a' } } } }])).toThrow(/not supported/)
    })

    test('allows updates to unrelated fields', () => {
      const hook = getHooks(schema, '_pres', 'bulkWrite')[0]

      expect(() => hook.call({}, [{ updateOne: { update: { $set: { state: 'a' } } } }])).not.toThrow()
    })
  })

  describe('update queries', () => {
    test('updateOne > rebuilds searchGrams for the documents it matched', async () => {
      const { query, toArray, find, bulkWrite } = createQuery('updateOne', { $set: { name: 'New' } })
      toArray.mockResolvedValueOnce([{ _id: 1 }]).mockResolvedValueOnce([{ _id: 1, name: 'New', tags: ['cat'] }])

      await runUpdate(query, { modifiedCount: 1 })

      expect(find).toHaveBeenNthCalledWith(1, { id: 'a' }, expect.objectContaining({ projection: { _id: 1 } }))
      expect(find).toHaveBeenNthCalledWith(2, { _id: { $in: [1] } }, expect.anything())
      expect(bulkWrite).toHaveBeenCalledWith(
        [{ updateOne: { filter: { _id: 1 }, update: { $set: { searchGrams: toSearchGrams('New', 'cat') } } } }],
        expect.anything(),
      )
    })

    test('updateOne > includes the document created by an upsert', async () => {
      const { query, toArray, find } = createQuery('updateOne', { $set: { name: 'New' } })
      toArray.mockResolvedValueOnce([]).mockResolvedValueOnce([{ _id: 2, name: 'New' }])

      await runUpdate(query, { upsertedId: 2 })

      expect(find).toHaveBeenNthCalledWith(2, { _id: { $in: [2] } }, expect.anything())
    })

    test('findOneAndUpdate > includes the returned document', async () => {
      const { query, toArray, find } = createQuery('findOneAndUpdate', { $set: { description: 'New' } })
      toArray.mockResolvedValueOnce([]).mockResolvedValueOnce([{ _id: 3, description: 'New' }])

      await runUpdate(query, { _id: 3 })

      expect(find).toHaveBeenNthCalledWith(2, { _id: { $in: [3] } }, expect.anything())
    })

    test('replaceOne > always rebuilds, even if the replacement omits the search fields', async () => {
      const { query, toArray, bulkWrite } = createQuery('replaceOne', { state: 'live' })
      toArray.mockResolvedValueOnce([{ _id: 1 }]).mockResolvedValueOnce([{ _id: 1 }])

      await runUpdate(query, {})

      expect(bulkWrite).toHaveBeenCalledWith(
        [{ updateOne: { filter: { _id: 1 }, update: { $set: { searchGrams: [] } } } }],
        expect.anything(),
      )
    })

    test('does nothing when the update does not touch the search fields', async () => {
      const { query, find, bulkWrite } = createQuery('updateMany', { $set: { state: 'live' } })

      await runUpdate(query, { modifiedCount: 5 })

      expect(find).not.toHaveBeenCalled()
      expect(bulkWrite).not.toHaveBeenCalled()
    })

    test('does not write when no documents matched', async () => {
      const { query, toArray, bulkWrite } = createQuery('updateOne', { $set: { name: 'New' } })
      toArray.mockResolvedValueOnce([])

      await runUpdate(query, { modifiedCount: 0 })

      expect(bulkWrite).not.toHaveBeenCalled()
    })
  })
})
