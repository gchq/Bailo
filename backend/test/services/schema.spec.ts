import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { createSchema, getSchemaById, searchSchemas, updateSchema } from '../../src/services/schema.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testModelSchema } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/services/review.ts')

const ModelModelMock = getTypedModelMock('ModelModel')
const ReviewRoleModelMock = getTypedModelMock('ReviewRoleModel')
const SchemaModelModelMock = getTypedModelMock('SchemaModel')

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/mongo.js', () => mockMongoUtils)

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
    expect(SchemaModelModelMock.save).toBeCalledTimes(1)
    expect(SchemaModelModelMock.deleteOne).not.toBeCalled()
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

    expect(SchemaModelModelMock.save).not.toBeCalled()
    expect(SchemaModelModelMock.deleteOne).not.toBeCalled()
  })

  test('a schema can be overwritten', async () => {
    SchemaModelModelMock.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema, true)
    expect(SchemaModelModelMock.deleteOne).toBeCalledTimes(1)
    expect(SchemaModelModelMock.save).toBeCalledTimes(1)
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

    await expect(() => createSchema(testUser, testModelSchema)).rejects.toThrowError(
      /^The following is not unique: {"mockKey":"mockValue"}/,
    )
  })

  test('that a schema can be retrieved by ID', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce(testModelSchema)
    const result = await getSchemaById(testModelSchema.id)
    expect(result).toEqual(testModelSchema)
  })

  test('that a schema cannot be retrieved by ID when schema does not exist', async () => {
    SchemaModelModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() => getSchemaById(testModelSchema.id)).rejects.toThrowError(/^The requested schema was not found/)
  })
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
  ReviewRoleModelMock.find.mockResolvedValueOnce([{ shortName: testReviewer, name: testReviewer, toObject: () => {} }])

  const updatedSchema = await updateSchema({} as any, 'schema-123', diff)

  expect(updatedSchema.reviewRoles.includes(testReviewer))
})
