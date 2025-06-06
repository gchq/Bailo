import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { UserInterface } from '../../src/models/User.js'
import { createSchema, getSchemaById, searchSchemas } from '../../src/services/schema.js'
import { testModelSchema } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const mockSchema = vi.hoisted(() => {
  const mockedMethods = {
    save: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ['schema-1', 'schema-2']) })),
    findOne: vi.fn(),
  }

  const Schema: any = vi.fn(() => ({
    save: mockedMethods.save,
  }))
  Schema.find = mockedMethods.find
  Schema.findOne = mockedMethods.findOne
  Schema.deleteOne = mockedMethods.deleteOne

  return {
    ...mockedMethods,
    Schema,
  }
})
vi.mock('../../src/models/Schema.js', () => ({
  default: mockSchema.Schema,
}))

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

describe('services > schema', () => {
  const testUser = { dn: 'user' } as UserInterface

  test('that all schemas can be retrieved', async () => {
    const result = await searchSchemas('model')
    expect(result).toEqual(['schema-1', 'schema-2'])
  })

  test('a schema can be created', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(mockSchema.deleteOne).not.toBeCalled()
    expect(result).toBe(testModelSchema)
  })

  test('a schema cannot be created due to authorisation', async () => {
    vi.mocked(authorisation.schema).mockResolvedValue({
      info: 'You do not have permission to create this schema.',
      success: false,
      id: '',
    })

    const result = () => createSchema(testUser, testModelSchema)
    await expect(result).rejects.toThrowError(/^You do not have permission to create this schema./)

    expect(mockSchema.save).not.toBeCalled()
    expect(mockSchema.deleteOne).not.toBeCalled()
  })

  test('a schema can be overwritten', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema, true)
    expect(mockSchema.deleteOne).toBeCalledTimes(1)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(result).toBe(testModelSchema)
  })

  test('an error is thrown on create collision', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    mongoError.keyValue = {
      mockKey: 'mockValue',
    }
    mockSchema.save.mockRejectedValueOnce(mongoError)
    mockMongoUtils.isMongoServerError.mockReturnValueOnce(true)

    await expect(() => createSchema(testUser, testModelSchema)).rejects.toThrowError(
      /^The following is not unique: {"mockKey":"mockValue"}/,
    )
  })

  test('that a schema can be retrieved by ID', async () => {
    mockSchema.findOne.mockResolvedValueOnce(testModelSchema)
    const result = await getSchemaById(testModelSchema.id)
    expect(result).toEqual(testModelSchema)
  })

  test('that a schema cannot be retrieved by ID when schema does not exist', async () => {
    await expect(() => getSchemaById(testModelSchema.id)).rejects.toThrowError(/^The requested schema was not found/)
  })
})
