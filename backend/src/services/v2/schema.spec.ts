import { describe, expect, test, vi } from 'vitest'

import { testModelSchema } from '../../utils/v2/test/testModels.js'
import { createSchema, findSchemasByKind } from './schema.js'

const mockSchema = vi.hoisted(() => {
  const mockedMethods = {
    save: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ['schema-1', 'schema-2']) })),
  }

  const Schema: any = vi.fn(() => ({
    save: mockedMethods.save,
  }))
  Schema.find = mockedMethods.find
  Schema.deleteOne = mockedMethods.deleteOne

  return {
    ...mockedMethods,
    Schema,
  }
})
vi.mock('../../models/v2/Schema.js', () => ({
  SchemaKind: {
    Model: 'model',
  },
  default: mockSchema.Schema,
}))

describe('services > schema', () => {
  test('that all schemas can be retrieved', async () => {
    const result = await findSchemasByKind('model')
    expect(result).toEqual(['schema-1', 'schema-2'])
  })

  test('a schema can be created', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testModelSchema)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(mockSchema.deleteOne).not.toBeCalled()
    expect(result).toBe(testModelSchema)
  })

  test('a schema can be overwritten', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testModelSchema, true)
    expect(mockSchema.deleteOne).toBeCalledTimes(1)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(result).toBe(testModelSchema)
  })
})
