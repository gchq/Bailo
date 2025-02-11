import { describe, expect, test, vi } from 'vitest'

import { ModelAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { ModelCardRevisionDoc } from '../../src/models/ModelCardRevision.js'
import {
  _setModelCard,
  canUserActionModelById,
  createModel,
  createModelCardFromSchema,
  createModelCardFromTemplate,
  getCurrentUserPermissionsByModel,
  getModelById,
  getModelCardRevision,
  isModelCardRevisionDoc,
  saveImportedModelCard,
  searchModels,
  setLatestImportedModelCard,
  updateModel,
  updateModelCard,
} from '../../src/services/model.js'
import { EntryUserPermissions } from '../../src/types/types.js'

vi.mock('../../src/connectors/authorisation/index.js')

const schemaMock = vi.hoisted(() => ({
  getSchemaById: vi.fn(() => ({ jsonschema: {} })),
}))
vi.mock('../../src/services/schema.js', async () => schemaMock)

const validatorType = vi.hoisted(() => ({
  isValidatorResultError: vi.fn(() => true),
}))
vi.mock('../../src/types/ValidatorResultError.js', async () => validatorType)

const modelCardRevisionModel = vi.hoisted(() => {
  const obj: any = {}

  obj.findOne = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)

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

const validator = vi.hoisted(() => ({ validate: vi.fn() }))
vi.mock('jsonschema', () => ({
  Validator: vi.fn(() => validator),
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
  obj.findOneAndUpdate = vi.fn(() => obj)
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
  getUserInformation: vi.fn(() => ({ name: 'user', email: 'user@example.com' })),
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
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
    expect(modelMocks.save).not.toBeCalled()
  })

  test('createModel > bad request is thrown when attempting to set both source and destinationModelId simultaneously', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({
      info: 'You cannot select both settings simultaneously.',
      success: false,
      id: '',
    })

    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(
      /^You cannot select both settings simultaneously./,
    )
    expect(modelMocks.save).not.toBeCalled()
  })

  test('createModel > should throw an internal error if getUserInformation fails due to invalid user', async () => {
    authenticationMocks.getUserInformation.mockImplementation(() => {
      throw new Error('Unable to find user user:unknown_user')
    })
    expect(() =>
      createModel({} as any, { collaborators: [{ entity: 'user:unknown_user', roles: [] }] } as any),
    ).rejects.toThrowError(/^Unable to find user user:unknown_user/)
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
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

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

    modelCardRevisionModel.findOne.mockResolvedValueOnce(undefined)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^Version '.*' does not exist/,
    )
  })

  test('getModelCardRevision > should throw Forbidden if user does not have permission to view modelCard', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne.mockResolvedValueOnce(mockModelCard)
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

    modelCardRevisionModel.findOne.mockResolvedValueOnce(mockModelCard)

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

  test('updateModel > should throw an internal error if getUserInformation fails due to invalid user', async () => {
    authenticationMocks.getUserInformation.mockImplementation(() => {
      throw new Error('Unable to find user user:unknown_user')
    })
    expect(() =>
      updateModel({} as any, '123', { collaborators: [{ entity: 'user:unknown_user', roles: [] }] }),
    ).rejects.toThrowError(/^Unable to find user user:unknown_user/)
  })

  test('createModelCardFromSchema > should throw an error when attempting to change a model from mirrored to standard', async () => {
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

  test('saveImportedModelCard > unknown error when trying to validate model card', async () => {
    modelMocks.findOne.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: 'abc' } } })
    validator.validate.mockImplementationOnce(() => {
      throw Error('Unable to validate.')
    })
    validatorType.isValidatorResultError.mockReturnValueOnce(false)

    const result = saveImportedModelCard({} as Omit<ModelCardRevisionDoc, '_id'>)

    expect(result).rejects.toThrowError(/^Unable to validate./)
  })

  test('saveImportedModelCard > successfully saves model card', async () => {
    modelMocks.findOne.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: 'abc' } } })
    await saveImportedModelCard({ modelId: 'id', version: 'version' } as any)

    expect(modelCardRevisionModel.findOneAndUpdate).toBeCalledWith(
      { modelId: 'id', version: 'version' },
      { modelId: 'id', version: 'version' },
      { upsert: true },
    )
  })

  test('setLatestImportedModelCard > success', async () => {
    await setLatestImportedModelCard('abc')

    expect(modelMocks.updateOne).toHaveBeenCalledOnce()
  })

  test('setLatestImportedModelCard > cannot find latest model card', async () => {
    modelCardRevisionModel.findOne.mockResolvedValueOnce()
    const result = setLatestImportedModelCard('abc')

    await expect(result).rejects.toThrowError(/^Cannot find latest model card./)
  })

  test('setLatestImportedModelCard > cannot update model', async () => {
    modelMocks.findOneAndUpdate.mockResolvedValueOnce()
    const result = setLatestImportedModelCard('abc')

    await expect(result).rejects.toThrowError(/^Unable to set latest model card of mirrored model./)
  })

  test('isModelCardRevisionDoc > success', async () => {
    const result = isModelCardRevisionDoc({
      modelId: '',
      schemaId: '',
      version: '',
      createdBy: '',
      updatedAt: '',
      createdAt: '',
      _id: '',
    })

    expect(result).toBe(true)
  })

  test('isModelCardRevisionDoc > missing property', async () => {
    const result = isModelCardRevisionDoc({
      schemaId: '',
      version: '',
      createdBy: '',
      updatedAt: '',
      createdAt: '',
      _id: '',
    })

    expect(result).toBe(false)
  })

  test('isModelCardRevisionDoc > wrong type', async () => {
    const result = isModelCardRevisionDoc(null)

    expect(result).toBe(false)
  })

  test('crateModelCardFromTemplate > can create a model using a template', async () => {
    const testModel = {
      name: 'test model',
      settings: {
        mirror: {},
      },
    }
    const testTemplate = {
      name: 'test template',
      settings: {
        mirror: {},
      },
      card: {
        schemaId: 'test-schema',
        version: '1',
        createdBy: 'User',
        metadata: {
          overview: {
            questionOne: 'test',
          },
        },
      },
    }
    modelMocks.findOne.mockResolvedValueOnce(testModel)
    modelMocks.findOne.mockResolvedValueOnce(testTemplate)
    await createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')
    expect(modelCardRevisionModel.save).toBeCalled()
    expect(modelMocks.updateOne).toBeCalled()
  })

  test('createModelCardFromTemplate > requesting to use a template without a model card will throw an error', async () => {
    const testModel = {
      name: 'test model',
      settings: {
        mirror: {},
      },
    }
    modelMocks.findOne.mockResolvedValue(testModel)
    expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')).rejects.toThrowError(
      /^The template model is missing a model card/,
    )
  })

  test('createModelCardFromTemplate > throw bad request when supplying the same template and model id', async () => {
    expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testModel')).rejects.toThrowError(
      'The model and template ID must be different',
    )
  })

  test('createModelCardFromTemplate > throw forbidden when user does not have access to template', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'User does not have access to model',
      success: false,
      id: '',
    })
    expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')).rejects.toThrowError(
      'User does not have access to model',
    )
  })

  test('getCurrentUserPermissionsByModel > current user has all model permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockPermissions: EntryUserPermissions = {
      editEntry: { hasPermission: true },
      editEntryCard: { hasPermission: true },
      createRelease: { hasPermission: true },
      editRelease: { hasPermission: true },
      deleteRelease: { hasPermission: true },
      pushModelImage: { hasPermission: true },
      createInferenceService: { hasPermission: true },
      editInferenceService: { hasPermission: true },
      exportMirroredModel: { hasPermission: true },
    }

    modelMocks.findOne.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.model)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.release)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.image).mockResolvedValueOnce({ success: true, id: '' })

    const permissions = await getCurrentUserPermissionsByModel(mockUser, mockModelId)

    expect(modelMocks.findOne).toBeCalled()
    expect(permissions).toEqual(mockPermissions)
  })

  test('getCurrentUserPermissionsByModel > current user has no model permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockPermissions: EntryUserPermissions = {
      editEntry: { hasPermission: false, info: 'mocked' },
      editEntryCard: { hasPermission: false, info: 'mocked' },
      createRelease: { hasPermission: false, info: 'mocked' },
      editRelease: { hasPermission: false, info: 'mocked' },
      deleteRelease: { hasPermission: false, info: 'mocked' },
      pushModelImage: { hasPermission: false, info: 'mocked' },
      createInferenceService: { hasPermission: false, info: 'mocked' },
      editInferenceService: { hasPermission: false, info: 'mocked' },
      exportMirroredModel: { hasPermission: false, info: 'mocked' },
    }

    modelMocks.findOne.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.model)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
    vi.mocked(authorisation.release)
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
    vi.mocked(authorisation.image).mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })

    const permissions = await getCurrentUserPermissionsByModel(mockUser, mockModelId)

    expect(modelMocks.findOne).toBeCalled()
    expect(permissions).toEqual(mockPermissions)
  })
})
