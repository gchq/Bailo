import ModelModel from '../models/Model'
import VersionModel from '../models/Version'
import '../utils/mockMongo'
import { testModel, testModel2, testVersion, userDoc } from '../utils/test/testModels'
import {
  createModel,
  findModelById,
  findModelByUuid,
  findModels,
  isValidFilter,
  isValidType,
  removeVersionFromModel,
  serializedModelFields,
} from './model'

let modelId

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
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      versions: {
        remove: jest.fn(() => Promise.resolve()),
        length: 0,
      },
    }
    jest.spyOn(ModelModel, 'findById').mockReturnValueOnce(mockModel)

    await removeVersionFromModel(userDoc, testVersion)

    expect(mockModel.delete).toHaveBeenCalledTimes(1)
  })

  test('latest version is updated if that version is removed', async () => {
    const mockModel = {
      ...testModel,
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      versions: {
        remove: jest.fn(() => Promise.resolve()),
        at: jest.fn(() => 'new latest version'),
        length: 3,
      },
    }

    jest.spyOn(ModelModel, 'findById').mockReturnValueOnce(mockModel)

    await removeVersionFromModel(userDoc, testVersion)

    expect(mockModel.latestVersion).toEqual('new latest version')
  })
})
