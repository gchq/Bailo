import { describe, expect, test, vi } from 'vitest'

import { UserInterface } from '../../src/models/User.js'
import {
  createSchemaMigrationPlan,
  runModelSchemaMigration,
  searchSchemaMigrationById,
  searchSchemaMigrations,
  updateSchemaMigrationPlan,
} from '../../src/services/schemaMigration.js'
import { SchemaMigrationKind } from '../../src/types/enums.js'
import { testModelSchema, testSchemaMigration } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const mockSchemaMigration = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(function () {
    return obj
  })
  obj.match = vi.fn(function () {
    return obj
  })
  obj.sort = vi.fn(function () {
    return obj
  })
  obj.lookup = vi.fn(function () {
    return obj
  })
  obj.append = vi.fn(function () {
    return obj
  })
  obj.find = vi.fn(function () {
    return obj
  })
  obj.findOne = vi.fn(function () {
    return obj
  })
  obj.findOneAndUpdate = vi.fn(function () {
    return obj
  })
  obj.updateOne = vi.fn(function () {
    return obj
  })
  obj.save = vi.fn(function () {
    return obj
  })
  obj.findByIdAndUpdate = vi.fn(function () {
    return obj
  })

  const model: any = vi.fn(function () {
    return obj
  })
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

  obj.aggregate = vi.fn(function () {
    return obj
  })
  obj.match = vi.fn(function () {
    return obj
  })
  obj.sort = vi.fn(function () {
    return obj
  })
  obj.lookup = vi.fn(function () {
    return obj
  })
  obj.append = vi.fn(function () {
    return obj
  })
  obj.find = vi.fn(function () {
    return obj
  })
  obj.findOne = vi.fn(function () {
    return obj
  })
  obj.findOneAndUpdate = vi.fn(function () {
    return obj
  })
  obj.updateOne = vi.fn(function () {
    return obj
  })
  obj.save = vi.fn(function () {
    return obj
  })
  obj.findByIdAndUpdate = vi.fn(function () {
    return obj
  })

  const model: any = vi.fn(function () {
    return obj
  })
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Model.js', () => ({ default: modelMocks }))

const schemaMocks = vi.hoisted(() => {
  const obj: any = { settings: { mirror: { sourceModelId: '' } } }

  obj.aggregate = vi.fn(function () {
    return obj
  })
  obj.match = vi.fn(function () {
    return obj
  })
  obj.sort = vi.fn(function () {
    return obj
  })
  obj.lookup = vi.fn(function () {
    return obj
  })
  obj.append = vi.fn(function () {
    return obj
  })
  obj.find = vi.fn(function () {
    return obj
  })
  obj.findOne = vi.fn(function () {
    return obj
  })
  obj.findOneAndUpdate = vi.fn(function () {
    return obj
  })
  obj.updateOne = vi.fn(function () {
    return obj
  })
  obj.save = vi.fn(function () {
    return obj
  })
  obj.findByIdAndUpdate = vi.fn(function () {
    return obj
  })

  const model: any = vi.fn(function () {
    return obj
  })
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

  test('searchSchemaMigrationById > success', async () => {
    const schemaMigrationId = 'test-id'
    mockSchemaMigration.findOne.mockResolvedValueOnce(testSchemaMigration)
    const res = await searchSchemaMigrationById(schemaMigrationId)
    expect(res).toBe(testSchemaMigration)
  })

  test('searchSchemaMigrationById > not found', async () => {
    const schemaMigrationId = 'test-id'
    mockSchemaMigration.findOne.mockResolvedValueOnce(null)
    await expect(() => searchSchemaMigrationById(schemaMigrationId)).rejects.toThrowError(
      'Cannot find specified schema migration plan.',
    )
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
      toObject: vi.fn(function () {
        return {
          _id: 'test',
        }
      }),
    })
    await expect(() =>
      runModelSchemaMigration({} as UserInterface, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Model cannot be migrated as it does not have a valid model card./)
  })

  test('cannot run a schema migration plan when there is no schema migration plan available', async () => {
    modelMocks.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          card: { testProperty: 'test' },
        }
      }),
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
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          card: { testProperty: 'test', schemaId: 'invalid-schema-id' },
        }
      }),
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
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          card: sourceCard,
        }
      }),
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

  test('update migration > suceess', async () => {
    await updateSchemaMigrationPlan(testUser, '1241', {
      name: 'my migration plan',
      description: 'This is a test migration plan',
      questionMigrations: [
        {
          id: 'test',
          kind: SchemaMigrationKind.Move,
          sourcePath: 's1.q1',
          targetPath: 's2.q1',
          propertyType: 'string',
        },
      ],
      draft: true,
    })
    expect(mockSchemaMigration.save).toBeCalled()
  })

  test('update migration > not found', async () => {
    mockSchemaMigration.findOne.mockResolvedValueOnce(null)

    await expect(() =>
      updateSchemaMigrationPlan(testUser, '1241', {
        name: 'my migration plan',
        description: 'This is a test migration plan',
        questionMigrations: [
          {
            id: 'test',
            kind: SchemaMigrationKind.Move,
            sourcePath: 's1.q1',
            targetPath: 's2.q1',
            propertyType: 'string',
          },
        ],
        draft: true,
      }),
    ).rejects.toThrowError('Cannot find specified schema migration plan.')
  })
})
