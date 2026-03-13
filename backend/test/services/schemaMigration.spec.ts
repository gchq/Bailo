import { describe, expect, test, vi } from 'vitest'

import { EntryKind } from '../../src/models/Model.js'
import { UserInterface } from '../../src/models/User.js'
import {
  createSchemaMigrationPlan,
  runModelSchemaMigration,
  searchSchemaMigrationById,
  searchSchemaMigrations,
  updateSchemaMigrationPlan,
} from '../../src/services/schemaMigration.js'
import { SchemaMigrationKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testModelSchema, testSchemaMigration } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const SchemaMigrationModelMock = getTypedModelMock('SchemaMigrationModel')
const ModelModelMock = getTypedModelMock('ModelModel')
const SchemaModelMock = getTypedModelMock('SchemaModel')
const ModelCardRevisionMock = getTypedModelMock('ModelCardRevisionModel')

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

describe('services > schemaMigration', () => {
  const testUser = { dn: 'user' } as any

  test('that all schemas migrations can be retrieved', async () => {
    SchemaMigrationModelMock.find.mockResolvedValueOnce([testSchemaMigration])
    const result = await searchSchemaMigrations()
    expect(result).toEqual([testSchemaMigration])
  })

  test('searchSchemaMigrationById > success', async () => {
    const schemaMigrationId = 'test-id'
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(testSchemaMigration)
    const res = await searchSchemaMigrationById(schemaMigrationId)
    expect(res).toBe(testSchemaMigration)
  })

  test('searchSchemaMigrationById > not found', async () => {
    const schemaMigrationId = 'test-id'
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(null)
    await expect(() => searchSchemaMigrationById(schemaMigrationId)).rejects.toThrowError(
      'Cannot find specified schema migration plan.',
    )
  })

  test('a schema migration plan can be created', async () => {
    SchemaMigrationModelMock.save.mockResolvedValueOnce(testSchemaMigration)
    const result = await createSchemaMigrationPlan(testUser, testSchemaMigration)
    expect(SchemaMigrationModelMock.save).toBeCalledTimes(1)
    expect(result).toBe(testSchemaMigration)
  })

  test('cannot run a schema migration plan when there is no model', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as any, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Model cannot be found/)
  })

  test('cannot run a schema migration plan when there is no valid model card', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(function () {
        return {
          _id: 'test',
        }
      }),
    })
    await expect(() =>
      runModelSchemaMigration({} as any, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Model cannot be migrated as it does not have a valid model card./)
  })

  test('cannot run a schema migration plan when there is no schema migration plan available', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          card: { testProperty: 'test' },
        }
      }),
    })
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as any, 'my-model-123', 'my-migration-plan-123'),
    ).rejects.toThrowError(/^Cannot find specified schema migration plan./)
  })

  test('cannot run schema migration plan where source schema does not exist', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          card: { testProperty: 'test', schemaId: 'invalid-schema-id' },
        }
      }),
    })
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(testSchemaMigration)
    SchemaModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() =>
      runModelSchemaMigration({} as any, 'my-model-123', 'my-migration-plan-123'),
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
    ModelModelMock.findOne.mockResolvedValueOnce(testModelForMigration)
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(testSchemaMigration)
    SchemaModelMock.findOne.mockResolvedValueOnce(testModelSchema)
    ModelCardRevisionMock.save.mockResolvedValueOnce(testModelForMigration)
    ModelModelMock.save.mockResolvedValueOnce(testModelForMigration)
    await runModelSchemaMigration({} as UserInterface, 'my-model-123', testSchemaMigration.id)
    expect(testModelForMigration.save).toBeCalledTimes(1)
    expect(testModelForMigration.set).toBeCalledTimes(4)
  })

  test('update migration > success', async () => {
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
    expect(SchemaMigrationModelMock.save).toBeCalled()
  })

  test('update migration > not found', async () => {
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(null)

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

  test('cannot run schema migration plan where mirrored model schema ID matches that of the source', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({
      _id: '1241',
      id: 'test-model',
      toObject: vi.fn(function () {
        return {
          _id: 'test',
          kind: EntryKind.MirroredModel,
          card: { testProperty: 'test', schemaId: 'example-model-schema-1' },
          mirroredCard: { testProperty: 'test', schemaId: 'example-model-schema-1' },
        }
      }),
      set: vi.fn(),
      save: vi.fn(),
    })
    SchemaMigrationModelMock.findOne.mockResolvedValueOnce(testSchemaMigration)
    SchemaModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() => runModelSchemaMigration({} as any, 'test-model', 'example-model-schema-1')).rejects.toThrowError(
      /^This mirrored model cannot be migrated as the schema matches that of the source model. Please migrate the source model first./,
    )
  })
})
