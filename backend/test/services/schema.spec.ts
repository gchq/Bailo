import { MongoServerError } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import {
  createSchema,
  deleteSchemaById,
  getSchemaById,
  searchSchemas,
  updateSchema,
  validateContentAgainstSchema,
} from '../../src/services/schema.js'
import { SchemaKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testModelSchema } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')
const configMock = vi.hoisted(
  () =>
    ({
      ui: {
        modelDetails: {
          organisations: ['Example Organisation'],
          states: ['Development', 'Review', 'Production'],
        },
        roleDisplayNames: {
          owner: 'Owner',
          contributor: 'Contributor',
          consumer: 'Consumer',
          riskOwner: 'Deployment Risk Owner',
        },
      },
      log: {
        level: 'info',
      },
      instrumentation: {
        enabled: true,
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

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

const validatorMock = vi.hoisted(() => ({ validate: vi.fn(() => ({ valid: true, errors: [] })) }))
vi.mock('jsonschema', () => ({
  Validator: vi.fn(function () {
    return validatorMock
  }),
}))

const validatorResultErrorMock = vi.hoisted(() => ({
  isValidatorResultError: vi.fn(() => false),
}))
vi.mock('../../src/types/ValidatorResultError.js', async () => validatorResultErrorMock)

const cacheMock = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  get: vi.fn(),
  set: vi.fn(),
  keys: vi.fn(),
  del: vi.fn(),
}))
vi.mock('node-cache', () => ({
  __esModule: true,
  default: vi.fn(
    class {
      get = cacheMock.get
      set = cacheMock.set
      keys = cacheMock.keys
      del = cacheMock.del
    },
  ),
}))

// Back the cache mock with an in-memory store so that invalidation can be asserted end to end.
beforeEach(() => {
  cacheMock.store.clear()
  cacheMock.get.mockImplementation((key: string) => cacheMock.store.get(key))
  cacheMock.set.mockImplementation((key: string, value: unknown) => {
    cacheMock.store.set(key, value)
    return true
  })
  cacheMock.keys.mockImplementation(() => [...cacheMock.store.keys()])
  cacheMock.del.mockImplementation((keys: string | string[]) => {
    const keysToDelete = Array.isArray(keys) ? keys : [keys]
    return keysToDelete.filter((key) => cacheMock.store.delete(key)).length
  })
})

describe('services > schema', () => {
  const testUser = { dn: 'user' } as any

  test('that all schemas can be retrieved', async () => {
    SchemaModelModelMock.sort.mockResolvedValue(['schema-1', 'schema-2'])

    const result = await searchSchemas('model')
    expect(result).toEqual(['schema-1', 'schema-2'])
  })

  test('that deployment assessment schemas include summary properties when searched', async () => {
    const deploymentAssessmentSchema = {
      kind: SchemaKind.DeploymentAssessment,
      jsonSchema: {
        properties: {
          assessment: {
            type: 'object',
          },
        },
      },
    }
    SchemaModelModelMock.sort.mockResolvedValueOnce([deploymentAssessmentSchema])

    const result = await searchSchemas(SchemaKind.DeploymentAssessment)

    expect(result[0].jsonSchema.properties).toEqual({
      overview: expect.objectContaining({
        title: 'Details',
        required: ['riskOwner', 'justification', 'modelIds'],
        properties: expect.objectContaining({
          riskOwner: expect.objectContaining({
            title: 'Who is the Deployment Risk Owner attached to this deployment assessment?',
            widget: 'entitySelector',
          }),
          modelIds: expect.objectContaining({ minItems: 1, uniqueItems: true }),
        }),
      }),
      assessment: {
        type: 'object',
      },
    })
    expect(result[0].jsonSchema.required).toEqual(['overview'])
  })

  test('that non-deployment assessment schemas are unchanged when searched', async () => {
    const modelSchema = structuredClone(testModelSchema)
    SchemaModelModelMock.sort.mockResolvedValueOnce([modelSchema])

    const result = await searchSchemas(SchemaKind.Model)

    expect(result[0].jsonSchema).toEqual(testModelSchema.jsonSchema)
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
    SchemaModelModelMock.replaceOne.mockResolvedValueOnce({})
    SchemaModelModelMock.findOne.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema, true)
    expect(SchemaModelModelMock.replaceOne).toHaveBeenCalledTimes(1)
    expect(SchemaModelModelMock.replaceOne).toHaveBeenCalledWith(
      { id: testModelSchema.id },
      expect.objectContaining({ ...testModelSchema, deleted: false }),
      { upsert: true },
    )
    expect(SchemaModelModelMock.save).not.toHaveBeenCalled()
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

    cacheMock.get.mockReturnValueOnce(cachedSchema)
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })

    const result = await getSchemaById(testModelSchema.id, 'Development')

    expect(result).toBe(cachedSchema)
    expect(cacheMock.get).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
    )
    expect(cacheMock.set).not.toHaveBeenCalled()
  })

  test('that a schema is stored in cache on a cache miss', async () => {
    const jsonSchema = { type: 'object', properties: {} }

    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: testModelSchema.id,
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: testModelSchema.id, jsonSchema }),
    })

    await getSchemaById(testModelSchema.id, 'Development')

    expect(cacheMock.get).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
    )
    expect(cacheMock.set).toHaveBeenCalledWith(
      JSON.stringify({ schemaId: testModelSchema.id, modelState: 'Development' }),
      expect.objectContaining({ id: testModelSchema.id }),
    )
  })

  test('validateContentAgainstSchema > should resolve when content is valid', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })

    await expect(await validateContentAgainstSchema(testModelSchema.id, { key: 'value' })).toStrictEqual({
      errors: [],
      valid: true,
    })
    expect(validatorMock.validate).toHaveBeenCalled()
  })

  test('validateContentAgainstSchema > allows fields to be incomplete but preserves draft requirements', async () => {
    const jsonSchema = {
      type: 'object',
      required: ['overview', 'assessment'],
      properties: {
        overview: {
          type: 'object',
          required: ['name', 'modelIds'],
          properties: {
            name: { type: 'string', minLength: 1, requiredForDraft: true },
            modelIds: { type: 'array', minItems: 1, uniqueItems: true },
          },
        },
      },
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'draft-schema',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'draft-schema', jsonSchema }),
    })

    await validateContentAgainstSchema('draft-schema', { overview: { name: 'Draft', modelIds: [] } }, { draft: true })

    expect(validatorMock.validate).toHaveBeenCalledWith(
      { overview: { name: 'Draft', modelIds: [] } },
      {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, requiredForDraft: true },
              modelIds: { type: 'array', uniqueItems: true },
            },
            required: ['name'],
          },
        },
        required: ['overview'],
      },
      { required: true },
    )
  })

  test('validateContentAgainstSchema > returns draft validation errors from the transformed schema', async () => {
    const jsonSchema = {
      type: 'object',
      required: ['overview'],
      properties: {
        overview: {
          type: 'object',
          required: ['name', 'modelIds'],
          properties: {
            name: { type: 'string', minLength: 1, requiredForDraft: true },
            modelIds: { type: 'array', minItems: 1, uniqueItems: true },
          },
        },
      },
    }
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'draft-schema',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'draft-schema', jsonSchema }),
    })
    validatorMock.validate.mockReturnValueOnce({ valid: false, errors: [] })

    await expect(validateContentAgainstSchema('draft-schema', { overview: {} }, { draft: true })).resolves.toEqual({
      valid: false,
      errors: [],
    })
    expect(validatorMock.validate).toHaveBeenCalledWith(
      { overview: {} },
      expect.objectContaining({
        properties: expect.objectContaining({
          overview: expect.objectContaining({ required: ['name'] }),
        }),
        required: ['overview'],
      }),
      { required: true },
    )
  })

  test('validateContentAgainstSchema > should throw NotFound when schema does not exist', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(validateContentAgainstSchema('non-existent-schema', {})).rejects.toThrow(
      /^The requested schema was not found/,
    )
  })

  test('validateContentAgainstSchema > should return invalid when content fails schema validation', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      ...testModelSchema,
      toObject: vi.fn().mockReturnValue(testModelSchema),
    })
    validatorMock.validate.mockReturnValueOnce({
      valid: false,
      errors: [],
    })

    expect((await validateContentAgainstSchema(testModelSchema.id, {})).valid).toBe(false)
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

  test.each([undefined, '', 'Development'])(
    'that updating a schema invalidates the cache for modelState %o',
    async (modelState) => {
      const jsonSchema = { type: 'object', properties: {} }
      const mockSchemaDoc = (name: string) => ({
        ...testModelSchema,
        name,
        jsonSchema,
        save: vi.fn(),
        toObject: vi.fn().mockReturnValue({ ...testModelSchema, name, jsonSchema }),
      })

      SchemaModelModelMock.findOne.mockResolvedValueOnce(mockSchemaDoc('Original name'))
      expect((await getSchemaById(testModelSchema.id, modelState)).name).toBe('Original name')

      SchemaModelModelMock.findOne.mockResolvedValueOnce(mockSchemaDoc('Original name'))
      await updateSchema(testUser, testModelSchema.id, { name: 'Updated name' })

      SchemaModelModelMock.findOne.mockResolvedValueOnce(mockSchemaDoc('Updated name'))
      expect((await getSchemaById(testModelSchema.id, modelState)).name).toBe('Updated name')
    },
  )

  test('that updating a schema leaves other schemas cached', async () => {
    const jsonSchema = { type: 'object', properties: {} }
    const otherSchemaKey = JSON.stringify({ schemaId: 'other-schema', modelState: 'Development' })

    SchemaModelModelMock.findOne.mockResolvedValueOnce({
      id: 'other-schema',
      jsonSchema,
      toObject: vi.fn().mockReturnValue({ id: 'other-schema', jsonSchema }),
    })
    await getSchemaById('other-schema', 'Development')
    expect(cacheMock.store.has(otherSchemaKey)).toBe(true)

    SchemaModelModelMock.findOne.mockResolvedValueOnce({ ...testModelSchema, save: vi.fn() })
    await updateSchema(testUser, testModelSchema.id, { name: 'Updated name' })

    expect(cacheMock.store.has(otherSchemaKey)).toBe(true)
  })

  test('that deleting a schema invalidates every cached modelState for that schema', async () => {
    const jsonSchema = { type: 'object', properties: {} }

    for (const modelState of [undefined, '', 'Development']) {
      SchemaModelModelMock.findOne.mockResolvedValueOnce({
        ...testModelSchema,
        jsonSchema,
        toObject: vi.fn().mockReturnValue({ ...testModelSchema, jsonSchema }),
      })
      await getSchemaById(testModelSchema.id, modelState)
    }
    expect(cacheMock.store.size).toBe(3)

    SchemaModelModelMock.findOne.mockResolvedValueOnce({ ...testModelSchema, deleteOne: vi.fn() })
    await deleteSchemaById(testUser, testModelSchema.id)

    expect(cacheMock.store.size).toBe(0)
  })
})
