import { describe, expect, test, vi } from 'vitest'

import {
  _setModelCard,
  doesModelCardExist,
  getModelCard,
  getModelCardLatestRevision,
  getModelCardRevision,
  searchModels,
} from '../../src/services/v2/modelCard.js'

const modelCardRevisionModel = vi.hoisted(() => {
  const model: any = {}

  model.findOne = vi.fn(() => undefined)

  return model
})
vi.mock('../../src/models/v2/ModelCardRevision.js', () => ({
  default: modelCardRevisionModel,
}))

const modelCardModel = vi.hoisted(() => {
  const model: any = {}

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.append = vi.fn(() => model)
  model.findOne = vi.fn(() => undefined)

  return model
})
vi.mock('../../src/models/v2/ModelCard.js', () => ({
  default: modelCardModel,
}))

const arrayAsyncFilter = vi.hoisted(() => {
  return {
    asyncFilter: vi.fn(() => []),
  }
})
vi.mock('../../src/utils/v2/array.js', () => ({
  asyncFilter: arrayAsyncFilter.asyncFilter,
}))

const canUserActionModelById = vi.hoisted(() => vi.fn(() => false))
vi.mock('../../src/services/v2/model.js', () => {
  return {
    canUserActionModelById,
  }
})

describe('services > modelCard', () => {
  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', undefined)

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, ['library'], ['mine'], 'search', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > bad filter', async () => {
    const user: any = { dn: 'test' }

    expect(() => searchModels(user, [], ['asdf' as any], '')).rejects.toThrowError()
    expect(arrayAsyncFilter.asyncFilter).not.toBeCalled()
  })

  test('getModelCard > should throw NotFound if model card does not exist', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModelId = '123'

    modelCardModel.findOne.mockResolvedValue(undefined)

    await expect(getModelCard(mockUser, mockModelId)).rejects.toThrow(/^The requested model card has no models/)
  })

  test('getModelCard > should throw Forbidden if user does not have view permission', async () => {
    const mockUser: any = { dn: 'testUser' }
    const mockModelId = '123'
    const mockModelCard = { modelId: mockModelId }

    modelCardModel.findOne.mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(false)

    await expect(getModelCard(mockUser, mockModelId)).rejects.toThrow(/^You do not have permission/)
  })

  test('getModelCard > should return model card if exists and user has view permission', async () => {
    const mockUser: any = { dn: 'testUser' }
    const mockModelId = '123'
    const mockModelCard = { modelId: mockModelId }

    modelCardModel.findOne.mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(true)

    const result = await getModelCard(mockUser, mockModelId)

    expect(result).toEqual(mockModelCard)
  })

  test('getModelCardLatestRevision > should throw NotFound if model card does not exist', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModelId = '123'

    modelCardRevisionModel.findOne.mockResolvedValue(undefined)

    await expect(getModelCardLatestRevision(mockUser, mockModelId)).rejects.toThrow(
      /^The requested model card has no models/
    )
  })

  test('getModelCardLatestRevision > should throw Forbidden if user does not have view permission', async () => {
    const mockUser: any = { dn: 'testUser' }
    const mockModelId = '123'
    const mockModelCard = { modelId: mockModelId }

    modelCardRevisionModel.findOne.mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(false)

    await expect(getModelCardLatestRevision(mockUser, mockModelId)).rejects.toThrow(/^You do not have permission/)
  })

  test('getModelCardLatestRevision > should return model card if exists and user has view permission', async () => {
    const mockUser: any = { dn: 'testUser' }
    const mockModelId = '123'
    const mockModelCard = { modelId: mockModelId }

    modelCardRevisionModel.findOne.mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(true)

    const result = await getModelCardLatestRevision(mockUser, mockModelId)

    expect(result).toEqual(mockModelCard)
  })

  test('should return false if model card does not exist', async () => {
    modelCardRevisionModel.findOne.mockResolvedValue(undefined)

    const result = await doesModelCardExist({ dn: 'test' } as any, '123')

    expect(result).toBe(false)
  })

  test('should return true if model card exists', async () => {
    modelCardRevisionModel.findOne.mockResolvedValue({})

    const result = await doesModelCardExist({ dn: 'test' } as any, '123')

    expect(result).toBe(true)
  })

  test('should throw NotFound if modelCard does not exist', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(undefined)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^Version '.*' does not exist/
    )
  })

  test('should throw Forbidden if user does not have permission to view modelCard', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(false)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^You do not have permission/
    )
  })

  test('should return modelCard if it exists and user has permission to view it', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)
    canUserActionModelById.mockResolvedValue(true)

    const result = await getModelCardRevision(mockUser, mockModelId, mockVersion)

    expect(result).toEqual(mockModelCard)
  })

  test('_setModelCard > should throw Forbidden if user does not have write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    canUserActionModelById.mockResolvedValue(false)

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^You do not have permission to update this model card/
    )
  })

  test('_setModelCard > should save and update model card if user has write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    canUserActionModelById.mockResolvedValue(true)

    const result = await _setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)

    expect(result).toBeDefined()
    expect(modelCardRevisionModel.save).toBeCalled()
    expect(modelCardModel.updateOne).toBeCalledWith(
      { modelId: mockModelId },
      {
        modelId: mockModelId,
        schemaId: mockSchemaId,
        version: mockVersion,
        metadata: mockMetadata,
      }
    )
  })
})
