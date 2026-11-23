import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findModels } from '../../src/repositories/model.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const ModelModelMock = getTypedModelMock('ModelModel')

const projection = {
  settings: false,
  card: false,
  deleted: false,
  _id: false,
  __v: false,
  deletedBy: false,
  deletedAt: false,
}

function entry(id: string, name: string, description = 'cats', tags: string[] = []) {
  return { id, name, description, tags }
}

function mockFindResults(...resultSets: unknown[][]) {
  const sorts = resultSets.map((results) => vi.fn().mockResolvedValue(results))
  for (const sort of sorts) {
    ModelModelMock.find.mockReturnValueOnce({ sort })
  }
  return sorts
}

describe('repositories > model', () => {
  describe('findModels', () => {
    beforeEach(() => {
      ModelModelMock.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
    })

    test('applies no filters and sorts by most recently updated when no params are given', async () => {
      const [sort] = mockFindResults([entry('a', 'A')])

      const result = await findModels({})

      expect(ModelModelMock.find).toHaveBeenCalledTimes(1)
      expect(ModelModelMock.find).toHaveBeenCalledWith({}, projection)
      expect(sort).toHaveBeenCalledWith({ updatedAt: -1 })
      expect(result).toStrictEqual([entry('a', 'A')])
    })

    test('ignores empty arrays', async () => {
      await findModels({ kind: [], organisations: [], states: [], libraries: [], collaboratorEntities: [] })

      expect(ModelModelMock.find).toHaveBeenCalledWith({}, projection)
    })

    test('filters by kind, organisations and states using $in', async () => {
      await findModels({ kind: ['model', 'data-card'], organisations: ['org'], states: ['live'] })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        { kind: { $in: ['model', 'data-card'] }, organisation: { $in: ['org'] }, state: { $in: ['live'] } },
        projection,
      )
    })

    test('filters by libraries using $all', async () => {
      await findModels({ libraries: ['tensorflow', 'pytorch'] })

      expect(ModelModelMock.find).toHaveBeenCalledWith({ tags: { $all: ['tensorflow', 'pytorch'] } }, projection)
    })

    test('filters by task alone', async () => {
      await findModels({ task: 'image-classification' })

      expect(ModelModelMock.find).toHaveBeenCalledWith({ tags: { $all: ['image-classification'] } }, projection)
    })

    test('combines task with libraries in a single tags filter', async () => {
      await findModels({ libraries: ['tensorflow'], task: 'image-classification' })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        { tags: { $all: ['tensorflow', 'image-classification'] } },
        projection,
      )
    })

    test('filters by schemaId, allowTemplating and visibility', async () => {
      await findModels({ schemaId: 'schema', allowTemplating: true, visibility: 'public' })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        { 'card.schemaId': { $all: ['schema'] }, 'settings.allowTemplating': true, visibility: 'public' },
        projection,
      )
    })

    test('does not filter on allowTemplating when it is false', async () => {
      await findModels({ allowTemplating: false })

      expect(ModelModelMock.find).toHaveBeenCalledWith({}, projection)
    })

    test('filters by collaborator entities using $all', async () => {
      await findModels({ collaboratorEntities: ['user:alice', 'user:bob'] })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        { 'collaborators.entity': { $all: ['user:alice', 'user:bob'] } },
        projection,
      )
    })

    test('matches any collaborator entity when no roles are given', async () => {
      await findModels({ collaboratorMatch: { entities: ['user:alice', 'group:devs'] } })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        { collaborators: { $elemMatch: { entity: { $in: ['user:alice', 'group:devs'] } } } },
        projection,
      )
    })

    test('matches collaborator entities holding one of the roles', async () => {
      await findModels({ collaboratorMatch: { entities: ['user:alice'], roles: ['owner'] } })

      expect(ModelModelMock.find).toHaveBeenCalledWith(
        {
          collaborators: {
            $elemMatch: { roles: { $elemMatch: { $in: ['owner'] } }, entity: { $in: ['user:alice'] } },
          },
        },
        projection,
      )
    })

    test('runs a single query for an empty search term', async () => {
      await findModels({ search: '' })

      expect(ModelModelMock.find).toHaveBeenCalledTimes(1)
      expect(ModelModelMock.find).toHaveBeenCalledWith({}, projection)
    })

    test('only runs the full text query when the term has no searchable characters', async () => {
      await findModels({ search: '--' })

      expect(ModelModelMock.find).toHaveBeenCalledTimes(1)
      expect(ModelModelMock.find.mock.calls[0][0]).toStrictEqual({ $text: { $search: '--' } })
    })

    test('does not return every entry for a term with no searchable characters', async () => {
      mockFindResults([entry('a', 'A')])

      const result = await findModels({ search: '--', titleOnly: true })

      expect(ModelModelMock.find).not.toHaveBeenCalled()
      expect(result).toStrictEqual([])
    })

    test('searches by trigrams then full text, keeping the other filters on both queries', async () => {
      await findModels({ search: 'clasifier', kind: ['model'] })

      expect(ModelModelMock.find).toHaveBeenCalledTimes(2)
      expect(ModelModelMock.find.mock.calls[0]).toStrictEqual([
        { kind: { $in: ['model'] }, searchGrams: { $in: expect.arrayContaining(['  c', ' cl', 'cla', 'ier', 'er ']) } },
        projection,
      ])
      expect(ModelModelMock.find.mock.calls[1]).toStrictEqual([
        { kind: { $in: ['model'] }, $text: { $search: 'clasifier' } },
        projection,
      ])
    })

    test('skips the full text query when titleOnly is set', async () => {
      await findModels({ search: 'clasifier', titleOnly: true })

      expect(ModelModelMock.find).toHaveBeenCalledTimes(1)
      expect(ModelModelMock.find.mock.calls[0][0]).toHaveProperty('searchGrams')
    })

    test('sorts full text matches by text score', async () => {
      const [, fullTextSort] = mockFindResults([], [])

      await findModels({ search: 'classifier' })

      expect(fullTextSort).toHaveBeenCalledWith({ score: { $meta: 'textScore' } })
    })

    test('keeps typo matches, drops unrelated entries and ranks the closest match first', async () => {
      mockFindResults(
        [
          entry('unrelated', 'Translator', 'words'),
          entry('partial', 'Image classification'),
          entry('exact', 'Image classifier'),
        ],
        [],
      )

      const result = await findModels({ search: 'clasifier' })

      expect(result.map((model) => model.id)).toStrictEqual(['exact', 'partial'])
    })

    test('keeps updatedAt order between equally similar matches', async () => {
      mockFindResults([entry('newer', 'Image classifier'), entry('older', 'Image classifier')], [])

      const result = await findModels({ search: 'classifier' })

      expect(result.map((model) => model.id)).toStrictEqual(['newer', 'older'])
    })

    test('matches on tags', async () => {
      mockFindResults([entry('tagged', 'Unnamed', 'nothing', ['segmentation'])], [])

      const result = await findModels({ search: 'segmentaton' })

      expect(result.map((model) => model.id)).toStrictEqual(['tagged'])
    })

    test('appends full text only matches after fuzzy matches without duplicates', async () => {
      mockFindResults(
        [entry('exact', 'Image classifier')],
        [entry('exact', 'Image classifier'), entry('card-only', 'Other', 'other')],
      )

      const result = await findModels({ search: 'classifier' })

      expect(result.map((model) => model.id)).toStrictEqual(['exact', 'card-only'])
    })

    test('returns full text matches when no entry is a fuzzy match', async () => {
      mockFindResults([], [entry('card-only', 'Other', 'other')])

      const result = await findModels({ search: 'classifier' })

      expect(result.map((model) => model.id)).toStrictEqual(['card-only'])
    })
  })
})
