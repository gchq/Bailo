import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import {
  createSchema,
  getSchemaById,
  searchSchemas,
  updateSchema,
  validateContentAgainstSchema,
} from '../../src/services/schema.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testModelSchema } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const ModelModelMock = getTypedModelMock('ModelModel')
const ReviewRoleModelMock = getTypedModelMock('ReviewRoleModel')
const SchemaModelModelMock = getTypedModelMock('SchemaModel')

const reviewServiceMocks = vi.hoisted(() => ({
  addReviewsForNewRole: vi.fn(),
}))
vi.mock('../../src/services/review.js', () => reviewServiceMocks)

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

const validatorMock = vi.hoisted(() => ({ validate: vi.fn() }))
vi.mock('jsonschema', () => ({
  Validator: vi.fn(function () {
    return validatorMock
  }),
}))

const validatorResultErrorMock = vi.hoisted(() => ({
  isValidatorResultError: vi.fn(() => false),
}))
vi.mock('../../src/types/ValidatorResultError.js', async () => validatorResultErrorMock)

const cacheGetSetMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))
vi.mock('node-cache', () => ({
  __esModule: true,
  default: vi.fn(
    class {
      get = cacheGetSetMock.get
      set = cacheGetSetMock.set
    },
  ),
}))

describe('services > schema', () => {
  const testUser = { dn: 'user' } as any

  test('that all schemas can be retrieved', async () => {
    SchemaModelModelMock.sort.mockResolvedValue(['schema-1', 'schema-2'])

    const result = await searchSchemas('model')
    expect(result).toEqual(['schema-1', 'schema-2'])
  })

  test('a schema can be created', async () => {
    SchemaModelModelMock.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema)
    expect(SchemaModelModelMock.save).toHaveBeenCalledTimes(1)
    expect(SchemaModelModelMock.deleteOne).not.toHaveBeenCalled()
    expect(result).toBe(testModelSchema)
  })

  test('a schema cannot be created due to authorisation', async () => {
    vi.mocked(authorisation.schema).mockResolvedValue({
      info: 'You do not have permission to create this schema.',
      success: false,
      id: '',
    })

    const result = () => createSchema(testUser, testModelSchema)
    await expect(result).rejects.toThrow(/^You do not have permission to create this schema./)

    expect(SchemaModelModelMock.save).not.toHaveBeenCalled()
    expect(SchemaModelModelMock.deleteOne).not.toHaveBeenCalled()
  })

  test('a schema can be overwritten', async () => {
    SchemaModelModelMock.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema, true)
    expect(SchemaModelModelMock.deleteOne).toHaveBeenCalledTimes(1)
    expect(SchemaModelModelMock.save).toHaveBeenCalledTimes(1)
    expect(result).toBe(testModelSchema)
  })

  test('an error is thrown on create collision', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    mongoError.keyValue = {
      mockKey: 'mockValue',
    }
    SchemaModelModelMock.save.mockRejectedValueOnce(mongoError)
    mockMongoUtils.isMongoServerError.mockReturnValueOnce(true)

    await expect(() => createSchema(testUser, testModelSchema)).rejects.toThrow(
      /^The following is not unique: {"mockKey":"mockValue"}/,
    )
  })

  test('that a schema can be retrieved by ID', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })
    const result = await getSchemaById(testModelSchema.id)
    expect(result).toEqual(testModelSchema)
  })

  test('that a schema cannot be retrieved by ID when schema does not exist', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() => getSchemaById(testModelSchema.id)).rejects.toThrow(/^The requested schema was not found/)
  })

  test('that a schema retrieved with a valid modelState has matching fields added to required', async () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          requiredByModelStates: ['Development'],
        },
      },
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'schema-with-state',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'schema-with-state', jsonSchema }),
    })

    const result = await getSchemaById('schema-with-state', 'Development')

    expect(result.jsonSchema.required).toContain('name')
  })

  test('that an invalid modelState throws a BadReq error', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'schema-bad-state',
      jsonSchema: { type: 'object', properties: {} },
      toObject: vi.fn().mockReturnValue({ id: 'schema-bad-state', jsonSchema: {} }),
    })

    await expect(() => getSchemaById('schema-bad-state', 'InvalidState')).rejects.toThrow(
      /The value for modelState is not a valid/,
    )
  })

  test('that a non-matching modelState does not add fields to required', async () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          requiredByModelStates: ['Production'],
        },
      },
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'schema-no-match',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'schema-no-match', jsonSchema }),
    })

    const result = await getSchemaById('schema-no-match', 'Development')

    expect(result.jsonSchema.required).toBeUndefined()
  })

  test('that a field is not duplicated in required when it already exists', async () => {
    const jsonSchema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          requiredByModelStates: ['Development'],
        },
      },
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'schema-no-dup',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'schema-no-dup', jsonSchema }),
    })

    const result = await getSchemaById('schema-no-dup', 'Development')

    expect(result.jsonSchema.required).toEqual(['name'])
    expect(result.jsonSchema.required).toHaveLength(1)
  })

  test('that a cached schema is returned when the cache is populated', async () => {
    const cachedSchema = { id: 'cached-schema', jsonSchema: { type: 'object' } } as any

    cacheGetSetMock.get.mockReturnValueOnce(cachedSchema)
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })

    const result = await getSchemaById(testModelSchema.id, 'Development')

    expect(result).toBe(cachedSchema)
    expect(cacheGetSetMock.get).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
    )
    expect(cacheGetSetMock.set).not.toHaveBeenCalled()
  })

  test('that a schema is stored in cache on a cache miss', async () => {
    const jsonSchema = { type: 'object', properties: {} }

    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: testModelSchema.id,
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: testModelSchema.id, jsonSchema }),
    })

    await getSchemaById(testModelSchema.id, 'Development')

    expect(cacheGetSetMock.get).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
    )
    expect(cacheGetSetMock.set).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
      expect.objectContaining({ id: testModelSchema.id }),
    )
  })

  test('validateContentAgainstSchema > should resolve when content is valid', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })

    await expect(validateContentAgainstSchema(testModelSchema.id, { key: 'value' })).resolves.toBeUndefined()
    expect(validatorMock.validate).toHaveBeenCalled()
  })

  test('validateContentAgainstSchema > should throw NotFound when schema does not exist', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(validateContentAgainstSchema('non-existent-schema', {})).rejects.toThrow(
      /^The requested schema was not found/,
    )
  })

  test('validateContentAgainstSchema > should throw UnprocessableContent when content fails schema validation', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })
    const validationError = { errors: [{ message: 'field is required' }] }
    validatorMock.validate.mockImplementationOnce(() => {
      throw validationError
    })
    validatorResultErrorMock.isValidatorResultError.mockReturnValueOnce(true)

    await expect(validateContentAgainstSchema(testModelSchema.id, {})).rejects.toThrow(
      /^Content could not be validated against the schema/,
    )
  })

  test('validateContentAgainstSchema > should re-throw non-validation errors', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })
    const unexpectedError = new Error('Unexpected error')
    validatorMock.validate.mockImplementationOnce(() => {
      throw unexpectedError
    })
    validatorResultErrorMock.isValidatorResultError.mockReturnValueOnce(false)

    await expect(validateContentAgainstSchema(testModelSchema.id, {})).rejects.toThrow('Unexpected error')
  })

  test('that we update review roles if they are changed on a schema', async () => {
    const testReviewer = 'reviewer2'
    const diff = {
      reviewRoles: [testReviewer],
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      save: vi.fn(),
    })
    ModelModelMock.find.mockResolvedValueOnce([
      {
        id: 'test-model',
        card: { schemaId: 'schema-123' },
        collaborators: [{ entity: 'user:user', roles: [testReviewer] }],
        save: vi.fn(),
      },
    ])
    ReviewRoleModelMock.find.mockResolvedValueOnce([
      { shortName: testReviewer, name: testReviewer, toObject: () => {} },
    ])

    const updatedSchema = await updateSchema({} as any, 'schema-123', diff)

    expect(updatedSchema.reviewRoles.includes(testReviewer))
  })
})
