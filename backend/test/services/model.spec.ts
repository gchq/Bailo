import { describe, expect, test, vi } from 'vitest'

import { ModelAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import {
  _setModelCard,
  canUserActionModelById,
  createModel,
  createModelCardFromSchema,
  getModelById,
  getModelCardRevision,
  searchModels,
  updateModel,
  updateModelCard,
} from '../../src/services/model.js'

vi.mock('../../src/connectors/authorisation/index.js')

const modelCardRevisionModel = vi.hoisted(() => {
  const obj: any = {}

  obj.findOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/ModelCardRevision.js', () => ({
  default: modelCardRevisionModel,
}))

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'model-id') }))
vi.mock('../../src/utils/id.js', () => ({
  convertStringToId: idMocks.convertStringToId,
}))

const modelMocks = vi.hoisted(() => {
  const obj: any = { settings: { mirror: { sourceModelId: '' } } }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Model.js', () => ({ default: modelMocks }))

const authenticationMocks = vi.hoisted(() => ({
  getEntities: vi.fn(() => ['user']),
}))
vi.mock('../../src/connectors/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

describe('services > model', () => {
  test('createModel > simple', async () => {
    await createModel({} as any, {} as any)

    expect(modelMocks.save).toBeCalled()
    expect(modelMocks).toBeCalled()
  })

  test('createModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
    expect(modelMocks.save).not.toBeCalled()
  })

  test('createModel > bad request is thrown when attempting to set both source and destinationModelId simultaneously', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'You cannot select both settings simultaneously.',
      success: false,
      id: '',
    })

    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(
      /^You cannot select both settings simultaneously./,
    )
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
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
  })

  test('getModelById > no model', async () => {
    modelMocks.findOne.mockResolvedValueOnce(undefined)

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^The requested entry was not found/)
  })

  test('canUserActionModelById > allowed', async () => {
    modelMocks.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({ success: true })
  })

  test('canUserActionModelById > not allowed', async () => {
    // getModelById call should initially succeed
    vi.mocked(authorisation.model).mockResolvedValueOnce({ success: true, id: '' })
    // But then the action trigger should fail
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    modelMocks.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({
      success: false,
      info: 'You do not have permission',
      id: '',
    })
  })

  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, 'model', [], [], '', undefined)
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, 'model', ['library'], ['mine'], 'search', 'task')
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, 'model', [], [], '', 'task')
  })

  test('searchModels > bad filter', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    expect(() => searchModels(user, 'model', [], ['asdf' as any], '')).rejects.toThrowError()
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
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

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

    const result = await getModelCardRevision(mockUser, mockModelId, mockVersion)

    expect(result).toEqual(mockModelCard)
  })

  test('_setModelCard > should throw Forbidden if user does not have write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    vi.mocked(authorisation.model).mockImplementation(async (_user, _model, action) => {
      if (action === ModelAction.View) return { success: true, id: '' }
      if (action === ModelAction.Write)
        return { success: false, info: 'You do not have permission to update this model card', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^You do not have permission to update this model card/,
    )
    expect(modelCardRevisionModel.save).not.toBeCalled()
  })

  test('_setModelCard > should throw BadReq if the user tries to alter a mirrored model card', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    vi.mocked(authorisation.model).mockImplementation(async (_user, _model, action) => {
      if (action === ModelAction.View) return { success: true, id: '' }
      if (action === ModelAction.Write) return { success: false, info: 'Cannot alter a mirrored model.', id: '' }
      if (action === ModelAction.Update) return { success: false, info: 'Cannot alter a mirrored model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^Cannot alter a mirrored model./,
    )
    expect(modelCardRevisionModel.save).not.toBeCalled()
  })

  test('_setModelCard > should save and update model card if user has write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    const result = await _setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)

    expect(result).toBeDefined()
    expect(modelCardRevisionModel.save).toBeCalled()
  })

  test('updateModelCard > should throw a bad request when attempting to change mirrored model card', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot alter a mirrored model.',
      success: false,
      id: '',
    })
    expect(() => updateModelCard({} as any, '123', {} as any)).rejects.toThrowError(/^Cannot alter a mirrored model./)
  })

  test('updateModel > should throw bad request when attempting to change a standard model to be a mirrored model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot change standard model to be a mirrored model.',
      success: false,
      id: '',
    })
    expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '', destinationModelId: '123' } } }),
    ).rejects.toThrowError(/^Cannot change standard model to be a mirrored model./)
  })

  test('updateModel > should throw bad request when attempting to change a destinationModel ID to a mirrored model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot set a destination model ID for a mirrored model.',
      success: false,
      id: '',
    })
    expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '', destinationModelId: '123' } } }),
    ).rejects.toThrowError(/^Cannot set a destination model ID for a mirrored model./)
  })

  test('updateModel > should throw a bad request when attempting to select both standard and mirror model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'You cannot select both mirror settings simultaneously.',
      success: false,
      id: '',
    })
    expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '123', destinationModelId: '234' } } }),
    ).rejects.toThrowError(/^You cannot select both mirror settings simultaneously./)
  })

  test('createModelcardFromSchema > should throw an error when attempting to change a model from mirrored to standard', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot alter a mirrored model.',
      success: false,
      id: '',
    })

    expect(() => createModelCardFromSchema({} as any, '123', 'abc')).rejects.toThrowError(
      /^Cannot alter a mirrored model./,
    )
    expect(modelMocks.save).not.toBeCalled()
  })
})
