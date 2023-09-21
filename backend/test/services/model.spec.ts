import { describe, expect, test, vi } from 'vitest'

import { ModelActionKeys } from '../../src/connectors/v2/authorisation/index.js'
import { ModelDoc } from '../../src/models/v2/Model.js'
import { UserDoc } from '../../src/models/v2/User.js'
import {
  _setModelCard,
  canUserActionModelById,
  createModel,
  getModelById,
  getModelCardRevision,
  searchModels,
} from '../../src/services/v2/model.js'

const arrayAsyncFilter = vi.hoisted(() => {
  return {
    asyncFilter: vi.fn(() => []),
  }
})
vi.mock('../../src/utils/v2/array.js', () => ({
  asyncFilter: arrayAsyncFilter.asyncFilter,
}))

const modelCardRevisionModel = vi.hoisted(() => {
  const obj: any = {}

  obj.findOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/ModelCardRevision.js', () => ({
  default: modelCardRevisionModel,
}))

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'model-id') }))
vi.mock('../../src/utils/v2/id.js', () => ({
  convertStringToId: idMocks.convertStringToId,
}))

const modelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Model.js', () => ({ default: modelMocks }))

const authorisationMocks = vi.hoisted(() => ({
  userModelAction: vi.fn(() => true),
  getEntities: vi.fn(() => ['user']),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  ...((await vi.importActual('../../src/connectors/v2/authorisation/index.js')) as object),
  default: authorisationMocks,
}))

describe('services > model', () => {
  test('createModel > simple', async () => {
    await createModel({} as any, {} as any)

    expect(modelMocks.save).toBeCalled()
    expect(modelMocks).toBeCalled()
  })

  test('createModel > bad authorisation', async () => {
    authorisationMocks.userModelAction.mockResolvedValueOnce(false)
    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
    expect(modelMocks.save).not.toBeCalled()
  })

  test('getModelById > good', async () => {
    modelMocks.findOne.mockResolvedValueOnce('mocked')

    const model = await getModelById({} as any, {} as any)

    expect(modelMocks.findOne).toBeCalled()
    expect(model).toBe('mocked')
  })

  test('getModelById > bad authorisation', async () => {
    modelMocks.findOne.mockResolvedValueOnce({})
    authorisationMocks.userModelAction.mockResolvedValueOnce(false)

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
  })

  test('getModelById > no model', async () => {
    modelMocks.findOne.mockResolvedValueOnce(undefined)

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^The requested model was not found/)
  })

  test('canUserActionModelById > allowed', async () => {
    modelMocks.findOne.mockResolvedValueOnce({} as any)
    authorisationMocks.userModelAction.mockResolvedValue(true)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toBe(true)
  })

  test('canUserActionModelById > not allowed', async () => {
    // getModelById call should initially succeed
    authorisationMocks.userModelAction.mockResolvedValueOnce(true)
    // But then the action trigger should fail
    authorisationMocks.userModelAction.mockResolvedValueOnce(false)

    modelMocks.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toBe(false)
  })

  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', undefined)

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, ['library'], ['mine'], 'search', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
  })

  test('searchModels > bad filter', async () => {
    const user: any = { dn: 'test' }

    expect(() => searchModels(user, [], ['asdf' as any], '')).rejects.toThrowError()
    expect(arrayAsyncFilter.asyncFilter).not.toBeCalled()
  })

  test('getModelCardRevision > should throw NotFound if modelCard does not exist', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(undefined)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^Version '.*' does not exist/,
    )
  })

  test('getModelCardRevision > should throw Forbidden if user does not have permission to view modelCard', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)
    authorisationMocks.userModelAction.mockResolvedValue(false)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^You do not have permission/,
    )
  })

  test('getModelCardRevision > should return modelCard if it exists and user has permission to view it', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)
    authorisationMocks.userModelAction.mockResolvedValue(true)

    const result = await getModelCardRevision(mockUser, mockModelId, mockVersion)

    expect(result).toEqual(mockModelCard)
  })

  test('_setModelCard > should throw Forbidden if user does not have write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    authorisationMocks.userModelAction.mockImplementation((async (
      user: UserDoc,
      model: ModelDoc,
      action: ModelActionKeys,
    ) => {
      // Only deny write actions
      if (action === 'write') return false
      return true
    }) as any)

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^You do not have permission to update this model card/,
    )
    expect(modelCardRevisionModel.save).not.toBeCalled()
  })

  test('_setModelCard > should save and update model card if user has write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    authorisationMocks.userModelAction.mockResolvedValue(true)

    const result = await _setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)

    expect(result).toBeDefined()
    expect(modelCardRevisionModel.save).toBeCalled()
  })
})
