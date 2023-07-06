import '../utils/mockMongo'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModelModel from '../models/Model.js'
import VersionModel from '../models/Version.js'
import { serializedModelFields } from '../utils/serializers.js'
import { testModel, testModel2, testVersion, testVersion2, userDoc } from '../utils/test/testModels.js'
import {
  createModel,
  findModelById,
  findModelByUuid,
  findModels,
  isValidFilter,
  isValidType,
  removeVersionFromModel,
} from './model.js'

let modelId: any

describe('test version service', () => {
  beforeEach(async () => {
    const versionDoc = await VersionModel.create(testVersion)
    testVersion._id = versionDoc._id
    const model = await ModelModel.create(testModel)
    modelId = model._id
  })

  test('that the serializer returns the correct properties', () => {
    // Need to improve this by testing an actual log entry to see if it has just the properties below
    const properties = serializedModelFields()
    expect(properties.mandatory).toStrictEqual([
      '_id',
      'uuid',
      'latestVersion.metadata.highLevelDetails.name',
      'schemaRef',
    ])
  })

  test('fetch model by uuid', async () => {
    const model: any = await findModelByUuid(userDoc, 'test-model')
    expect(model).not.toBe(undefined)
    expect(model.schemaRef).toBe(testModel.schemaRef)
  })

  test('fetch model by ID', async () => {
    const model: any = await findModelById(userDoc, modelId)
    expect(model.uuid).toBe(testModel.uuid)
  })

  test('is type valid', async () => {
    const validType = isValidType('all')
    expect(validType).toBe(true)
    const invalidType = isValidType('test')
    expect(invalidType).toBe(false)
  })

  test('is filter valid', async () => {
    const validFilter = isValidFilter('test')
    expect(validFilter).toBe(true)
    const invalidFilter = isValidFilter(34)
    expect(invalidFilter).toBe(false)
  })

  test('find models', async () => {
    const filter: any = { filter: '', type: 'all' }
    const models = await findModels(userDoc, filter)
    expect(models).not.toBe(undefined)
    expect(models.length).toBe(1)
  })

  test('create model', async () => {
    const model: any = await createModel(userDoc, testModel2)
    expect(model).not.toBe(undefined)
    expect(model.uuid).toBe(testModel2.uuid)
  })

  test('model is deleted if the sole version is removed', async () => {
    const mockModel = {
      ...testModel,
      save: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      versions: {
        remove: vi.fn(() => Promise.resolve()),
        length: 0,
      },
    }
    vi.spyOn(ModelModel, 'findById').mockReturnValueOnce(mockModel)

    await removeVersionFromModel(userDoc, testVersion)

    expect(mockModel.delete).toHaveBeenCalledTimes(1)
  })

  test('latest version is updated if that version is removed', async () => {
    const mockModel = {
      ...testModel,
      save: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      versions: {
        remove: vi.fn(() => Promise.resolve()),
        at: vi.fn(() => 'new latest version'),
        length: 3,
      },
    }

    vi.spyOn(ModelModel, 'findById').mockReturnValueOnce(mockModel)

    await removeVersionFromModel(userDoc, testVersion)

    expect(mockModel.latestVersion).toEqual('new latest version')
    expect(mockModel.delete).not.toHaveBeenCalled()
  })

  test('latest version is not updated if an older version is removed', async () => {
    const mockModel = {
      ...testModel,
      save: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      versions: {
        remove: vi.fn(() => Promise.resolve()),
        at: vi.fn(() => 'new latest version'),
        length: 3,
      },
    }
    const { latestVersion } = mockModel

    vi.spyOn(ModelModel, 'findById').mockReturnValueOnce(mockModel)

    await removeVersionFromModel(userDoc, testVersion2)

    expect(mockModel.latestVersion).toEqual(latestVersion)
    expect(mockModel.delete).not.toHaveBeenCalled()
  })
})
