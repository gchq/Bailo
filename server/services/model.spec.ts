import '../utils/mockMongo'
import { ObjectId } from 'mongodb'
import { ApprovalStates } from '../models/Deployment'
import VersionModel from '../models/Version'
import UserModel from '../models/User'
import ModelModel from '../models/Model'
import { findModelById, findModelByUuid, serializedModelFields, isValidType, isValidFilter, findModels, ModelFilter, createModel } from './model'

const modelId = new ObjectId()

const testVersion: any = {
  model: modelId,
  version: '1',
  metadata: {},
  built: false,
  managerApproved: ApprovalStates.NoResponse,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test',
  currentMetadata: {},
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date()
}

const testModel2: any = {
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test2',
  currentMetadata: {},
  owner: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date()
}

const testUser = {
  userId: 'user1',
  email: 'user1@email.com',
  data: { some: 'value' },
}
const userDoc = new UserModel(testUser)

describe('test version service', () => {
  beforeEach(async () => {
    const versionDoc = await VersionModel.create(testVersion)
    testVersion._id = versionDoc._id
    await ModelModel.create(testModel)
  })

  test('that the serializer returns the correct properties', () => {
    // Need to improve this by testing an actual log entry to see if it has just the properties below
    const properties = serializedModelFields()
    expect(properties.mandatory).toStrictEqual(['_id', 'uuid', 'currentMetadata.highLevelDetails.name', 'schemaRef'])
  })

  test('fetch model by uuid', async () => {
    const model: any = await findModelByUuid(userDoc, 'model-test')
    expect(model).not.toBe(undefined)
    expect(model.scheaRef).toBe(testModel.scheaRef)
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
    const filter: any = {filter: '', type: 'all'}
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
