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
    expect(properties.mandatory).toStrictEqual(['_id', 'uuid', 'currentMetadata.highLevelDetails.name', 'schemaRef'])
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
})
