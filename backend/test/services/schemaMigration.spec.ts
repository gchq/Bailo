import { describe, expect, test, vi } from 'vitest'

import { UserInterface } from '../../src/models/User.js'
import {
  createSchemaMigrationPlan,
  runModelSchemaMigration,
  searchSchemaMigrations,
} from '../../src/services/schemaMigration.js'
import { testModelSchema, testSchemaMigration } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const mockSchemaMigration = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/SchemaMigration.js', () => ({ default: mockSchemaMigration }))

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

const modelMocks = vi.hoisted(() => {
  const obj: any = { settings: { mirror: { sourceModelId: '' } } }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Model.js', () => ({ default: modelMocks }))

const schemaMocks = vi.hoisted(() => {
  const obj: any = { settings: { mirror: { sourceModelId: '' } } }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Schema.js', () => ({ default: schemaMocks }))

describe('services > schemaMigration', () => {
  const testUser = { dn: 'user' } as UserInterface

  test('that all schemas migrations can be retrieved', async () => {
    mockSchemaMigration.find.mockResolvedValueOnce([testSchemaMigration])
    const result = await searchSchemaMigrations()
    expect(result).toEqual([testSchemaMigration])
  })

  test('a schema migration plan can be created', async () => {
    mockSchemaMigration.save.mockResolvedValueOnce(testSchemaMigration)
    const result = await createSchemaMigrationPlan(testUser, testSchemaMigration)
    expect(mockSchemaMigration.save).toBeCalledTimes(1)
    expect(result).toBe(testSchemaMigration)
  })

  test('cannot run a schema migration plan when there is no model', async () => {
    modelMocks.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as UserInterface, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Model cannot be found/)
  })

  test('cannot run a schema migration plan when there is no valid model card', async () => {
    modelMocks.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(() => ({ _id: 'test' })),
    })
    await expect(() =>
      runModelSchemaMigration({} as UserInterface, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Model cannot be migrated as it does not have a valid model card./)
  })

  test('cannot run a schema migration plan when there is no schema migration plan available', async () => {
    modelMocks.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(() => ({ _id: 'test', card: { testProperty: 'test' } })),
    })
    mockSchemaMigration.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as UserInterface, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Cannot find specified schema migration plan./)
  })

  test('cannot run schema migration plan where source schema does not exist', async () => {
    modelMocks.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(() => ({ _id: 'test', card: { testProperty: 'test', schemaId: 'invalid-schema-id' } })),
    })
    mockSchemaMigration.findOne.mockResolvedValueOnce(testSchemaMigration)
    schemaMocks.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as UserInterface, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^The schema for this model does not match the migration plan's source schema./)
  })

  test('successfully runs a schema migration plan', async () => {
    const sourceCard = { schemaId: 'example-model-schema-1', metadata: { s1: { q1: 'Test answer' } } }
    const testModelForMigration = {
      _id: '1241',
      id: 'test-model',
      card: sourceCard,
      toObject: vi.fn(() => ({
        _id: 'test',
        card: sourceCard,
      })),
      set: vi.fn(),
      save: vi.fn(),
    }
    modelMocks.findOne.mockResolvedValueOnce(testModelForMigration)
    mockSchemaMigration.findOne.mockResolvedValueOnce(testSchemaMigration)
    schemaMocks.findOne.mockResolvedValueOnce(testModelSchema)
    await runModelSchemaMigration({} as UserInterface, 'my-model-123', testSchemaMigration.id)
    expect(testModelForMigration.save).toBeCalledTimes(2)
    expect(testModelForMigration.set).toBeCalledTimes(3)
  })
})
