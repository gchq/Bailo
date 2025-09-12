import { describe, expect, test, vi } from 'vitest'

import { UserInterface } from '../../src/models/User.js'
import { createSchemaMigrationPlan, searchSchemaMigrations } from '../../src/services/schemaMigration.js'
import { testSchemaMigration } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const mockSchemaMigration = vi.hoisted(() => {
  const mockedMethods = {
    save: vi.fn(),
    find: vi.fn(() => [testSchemaMigration]),
  }

  const SchemaMigration: any = vi.fn(() => ({
    save: mockedMethods.save,
  }))
  SchemaMigration.find = mockedMethods.find

  return {
    ...mockedMethods,
    SchemaMigration,
  }
})
vi.mock('../../src/models/SchemaMigration.js', () => ({
  default: mockSchemaMigration.SchemaMigration,
}))

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

describe('services > schemaMigration', () => {
  const testUser = { dn: 'user' } as UserInterface

  test('that all schemas migrations can be retrieved', async () => {
    const result = await searchSchemaMigrations()
    expect(result).toEqual([testSchemaMigration])
  })

  test('a schema can be created', async () => {
    mockSchemaMigration.save.mockResolvedValueOnce(testSchemaMigration)
    const result = await createSchemaMigrationPlan(testUser, testSchemaMigration)
    expect(mockSchemaMigration.save).toBeCalledTimes(1)
    expect(result).toBe(testSchemaMigration)
  })
})
