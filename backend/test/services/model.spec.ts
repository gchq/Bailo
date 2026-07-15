import { describe, expect, test, vi } from 'vitest'

import { ModelAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import {
  _setModelCard,
  canUserActionModelById,
  createModel,
  createModelCardFromSchema,
  createModelCardFromTemplate,
  getCurrentUserPermissionsByModel,
  getModelById,
  getModelByIdNoAuth,
  getModelCardRevision,
  getModelSystemRoles,
  getRoleEntities,
  isModelCardRevisionDoc,
  popularTagsForEntries,
  removeModel,
  searchModels,
  setLatestImportedModelCard,
  updateModel,
  updateModelCard,
} from '../../src/services/model.js'
import { EntrySearchOptionsParams, EntryUserPermissions } from '../../src/types/types.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')

const ModelModelMock = getTypedModelMock('ModelModel')
const ModelCardRevisionModelMock = getTypedModelMock('ModelCardRevisionModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

const accessRequestMock = vi.hoisted(() => ({
  getAccessRequestsByModel: vi.fn(() => [] as any[]),
  removeAccessRequests: vi.fn(),
}))
vi.mock('../../src/services/accessRequest.js', async () => accessRequestMock)

const fileMock = vi.hoisted(() => ({
  getFilesByModel: vi.fn(() => [] as any[]),
  removeFiles: vi.fn(),
}))
vi.mock('../../src/services/file.js', async () => fileMock)

const inferenceMock = vi.hoisted(() => ({
  getInferencesByModel: vi.fn(() => [] as any[]),
  removeInferences: vi.fn(),
}))
vi.mock('../../src/services/inference.js', async () => inferenceMock)

const registryMock = vi.hoisted(() => ({
  listModelImages: vi.fn(() => [] as any[]),
  softDeleteImage: vi.fn(),
}))
vi.mock('../../src/services/registry.js', async () => registryMock)

const releaseMock = vi.hoisted(() => ({
  deleteReleases: vi.fn((_user, modelId, semvers, _session?) => ({ modelId, semvers })),
  getModelReleases: vi.fn(() => [] as any[]),
}))
vi.mock('../../src/services/release.js', async () => releaseMock)

const reviewMock = vi.hoisted(() => ({
  findReviews: vi.fn(() => [] as any[]),
}))
vi.mock('../../src/services/review.js', async () => reviewMock)

const schemaMock = vi.hoisted(() => ({
  getSchemaById: vi.fn(() => ({ jsonschema: {}, reviewRoles: [] as string[] })),
  validateContentAgainstSchema: vi.fn(() => ({ valid: true, errors: [] })),
}))
vi.mock('../../src/services/schema.js', async () => schemaMock)

const tokenMock = vi.hoisted(() => ({
  dropModelIdFromTokens: vi.fn(),
  getTokensForModel: vi.fn(() => [] as any[]),
}))
vi.mock('../../src/services/token.js', async () => tokenMock)

const webhookMock = vi.hoisted(() => ({
  getWebhooksByModel: vi.fn(() => [] as any[]),
}))
vi.mock('../../src/services/webhook.js', async () => webhookMock)

const schedulerMock = vi.hoisted(() => ({
  cancelLifecycleJobsForModel: vi.fn(() => {}),
}))
vi.mock('../../src/services/schedule/scheduler.js', async () => schedulerMock)

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'model-id') }))
vi.mock('../../src/utils/id.js', () => ({
  convertStringToId: idMocks.convertStringToId,
}))

vi.mock('../../src/utils/database.js', async () => ({
  isTransactionsEnabled: vi.fn(() => false),
}))

const authenticationMocks = vi.hoisted(() => ({
  getEntities: vi.fn(() => ['user']),
  getUserInformation: vi.fn(() => ({ name: 'user', email: 'user@example.com' })),
  hasRole: vi.fn(function () {
    return {}
  }),
}))
vi.mock('../../src/connectors/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

describe('services > model', () => {
  test('createModel > simple', async () => {
    await createModel({} as any, {} as any)

    expect(ModelModelMock.save).toHaveBeenCalled()
    expect(ModelModelMock).toHaveBeenCalled()
  })

  test('createModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    await expect(() => createModel({} as any, {} as any)).rejects.toThrow(/^You do not have permission/)
    expect(ModelModelMock.save).not.toHaveBeenCalled()
  })

  test('createModel > bad request is thrown when attempting to set both source and destinationModelId simultaneously', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({
      info: 'You cannot select both settings simultaneously.',
      success: false,
      id: '',
    })

    await expect(() => createModel({} as any, {} as any)).rejects.toThrow(
      /^You cannot select both settings simultaneously./,
    )
    expect(ModelModelMock.save).not.toHaveBeenCalled()
  })

  test('createModel > should throw an internal error if getUserInformation fails due to invalid user', async () => {
    authenticationMocks.getUserInformation.mockImplementation(() => {
      throw new Error('Unable to find user user:unknown_user')
    })
    await expect(() =>
      createModel({} as any, { collaborators: [{ entity: 'user:unknown_user', roles: [] }] } as any),
    ).rejects.toThrow(/^Unable to find user user:unknown_user/)
  })

  test('createModel > throws an error when attempting to create a public untrusted model', async () => {
    const testModel = {
      name: 'untrusted model',
      kind: EntryKind.UntrustedModel,
      description: 'test',
      visibility: EntryVisibility.Public,
      collaborators: [],
      settings: { mirror: {}, ungovernedAccess: false, allowTemplating: false },
    }

    await expect(() => createModel({} as any, testModel)).rejects.toThrow(/^Untrusted models cannot be made public./)
    expect(ModelModelMock.save).not.toHaveBeenCalled()
  })

  test('getModelByIdNoAuth > good', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce('mocked')

    const model = await getModelByIdNoAuth({} as any, {} as any)

    expect(ModelModelMock.findOne).toHaveBeenCalled()
    expect(model).toBe('mocked')
  })

  test('getModelByIdNoAuth > no model', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(() => getModelByIdNoAuth({} as any, {} as any)).rejects.toThrow(/^The requested entry was not found/)
  })

  test('getModelById > bad authorisation', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({})
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    await expect(() => getModelById({} as any, {} as any)).rejects.toThrow(/^You do not have permission/)
  })

  describe('removeModel', () => {
    test('success empty', async () => {
      ModelCardRevisionModelMock.find.mockResolvedValueOnce([])

      const result = await removeModel({} as any, 'modelId')

      expect(result).toMatchSnapshot()
      expect(reviewMock.findReviews).toHaveBeenCalled()
      expect(registryMock.listModelImages).toHaveBeenCalled()
      expect(releaseMock.getModelReleases).toHaveBeenCalled()
      expect(tokenMock.getTokensForModel).toHaveBeenCalled()
      expect(webhookMock.getWebhooksByModel).toHaveBeenCalled()
      expect(ModelCardRevisionModelMock.find).toHaveBeenCalled()
      expect(fileMock.getFilesByModel).toHaveBeenCalled()
      expect(inferenceMock.getInferencesByModel).toHaveBeenCalled()
      expect(accessRequestMock.getAccessRequestsByModel).toHaveBeenCalled()

      expect(releaseMock.deleteReleases).toHaveBeenCalled()
      expect(accessRequestMock.removeAccessRequests).toHaveBeenCalled()
      expect(tokenMock.dropModelIdFromTokens).toHaveBeenCalled()
      expect(fileMock.removeFiles).toHaveBeenCalled()
      expect(inferenceMock.removeInferences).toHaveBeenCalled()
      expect(ModelModelMock.delete).toHaveBeenCalled()
    })

    test('no model', async () => {
      ModelModelMock.findOne.mockResolvedValueOnce(undefined)

      await expect(() => removeModel({} as any, 'modelId')).rejects.toThrow(/^The requested entry was not found./)
    })

    test('bad authorisation', async () => {
      ModelModelMock.findOne.mockResolvedValueOnce({})
      vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

      await expect(() => removeModel({} as any, 'modelId')).rejects.toThrow(/^You do not have permission/)
    })

    test('success entries', async () => {
      const itemsFound = 3
      const user = {} as any
      const modelId = 'modelId'
      const _id = '6776901b879d08e34b599d7e'
      const semver = '1.2.3'
      const accessRequestId = 'accessRequestId'
      const fileId = 'fileId'
      const modelCardRevisionMockDelete = vi.fn(() => Promise.resolve())
      const webhookMockDelete = vi.fn(() => Promise.resolve())

      reviewMock.findReviews.mockResolvedValueOnce(Array(itemsFound).fill({ _id }))
      registryMock.listModelImages.mockResolvedValueOnce(
        Array(itemsFound).fill({ tags: ['tag1', 'tag2'], repository: 'repository', name: 'name' }),
      )
      releaseMock.getModelReleases.mockResolvedValueOnce(Array(itemsFound).fill({ semver }))
      tokenMock.getTokensForModel.mockResolvedValueOnce(Array(itemsFound).fill({}))
      webhookMock.getWebhooksByModel.mockResolvedValueOnce(
        Array.from({ length: itemsFound }, () => ({
          delete: webhookMockDelete,
        })),
      )
      ModelCardRevisionModelMock.find.mockResolvedValueOnce(
        Array.from({ length: itemsFound }, () => ({
          delete: modelCardRevisionMockDelete,
        })),
      )
      fileMock.getFilesByModel.mockResolvedValueOnce(Array(itemsFound).fill({ id: fileId }))
      inferenceMock.getInferencesByModel.mockResolvedValueOnce(
        Array(itemsFound).fill({ modelId, image: 'image', tag: 'tag' }),
      )
      accessRequestMock.getAccessRequestsByModel.mockResolvedValueOnce(Array(itemsFound).fill({ id: accessRequestId }))

      const result = await removeModel(user, modelId)

      expect(result).toMatchSnapshot()
      expect(reviewMock.findReviews).toHaveBeenCalled()
      expect(registryMock.listModelImages).toHaveBeenCalled()
      expect(releaseMock.getModelReleases).toHaveBeenCalled()
      expect(tokenMock.getTokensForModel).toHaveBeenCalled()
      expect(webhookMock.getWebhooksByModel).toHaveBeenCalled()
      expect(ModelCardRevisionModelMock.find).toHaveBeenCalled()
      expect(fileMock.getFilesByModel).toHaveBeenCalled()
      expect(inferenceMock.getInferencesByModel).toHaveBeenCalled()
      expect(accessRequestMock.getAccessRequestsByModel).toHaveBeenCalled()

      expect(releaseMock.deleteReleases).toHaveBeenCalledWith(
        user,
        modelId,
        Array(itemsFound).fill(semver),
        true,
        undefined,
      )
      expect(modelCardRevisionMockDelete).toHaveBeenCalledTimes(itemsFound)
      expect(accessRequestMock.removeAccessRequests).toHaveBeenCalledWith(
        user,
        Array(itemsFound).fill(accessRequestId),
        undefined,
      )
      expect(ReviewModelMock.findByIdAndDelete).toHaveBeenCalledTimes(itemsFound)
      expect(ReviewModelMock.findByIdAndDelete.mock.calls.at(0)).toEqual([_id, undefined])
      expect(tokenMock.dropModelIdFromTokens).toHaveBeenCalledWith(user, modelId, Array(itemsFound).fill({}), undefined)
      expect(webhookMockDelete).toHaveBeenCalledTimes(itemsFound)
      expect(fileMock.removeFiles).toHaveBeenCalledWith(
        user,
        modelId,
        Array(itemsFound).fill(fileId),
        true,
        undefined,
        undefined,
      )
      expect(registryMock.softDeleteImage).toHaveBeenCalledTimes(itemsFound * 2)
      expect(registryMock.softDeleteImage.mock.calls.at(0)).toEqual([
        user,
        { repository: 'repository', name: 'name', tag: 'tag1' },
        true,
        undefined,
      ])
      expect(inferenceMock.removeInferences).toHaveBeenCalledWith(
        user,
        Array(itemsFound).fill({ modelId, image: 'image', tag: 'tag' }),
        undefined,
      )
      expect(ModelModelMock.delete).toHaveBeenCalled()
    })
  })

  test('canUserActionModelById > allowed', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({ success: true })
  })

  test('canUserActionModelById > not allowed', async () => {
    // getModelById call should initially succeed
    vi.mocked(authorisation.model).mockResolvedValueOnce({ success: true, id: '' })
    // But then the action trigger should fail
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    ModelModelMock.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({
      success: false,
      info: 'You do not have permission',
      id: '',
    })
  })

  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }
    ModelModelMock.sort.mockResolvedValueOnce([])

    const searchParams: EntrySearchOptionsParams = {
      kind: 'model',
      libraries: [],
      filters: [],
      organisations: [],
      states: [],
      search: '',
      task: undefined,
    }

    await searchModels(user, searchParams)
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }
    ModelModelMock.sort.mockResolvedValue([])
    const searchParams: EntrySearchOptionsParams = {
      kind: 'model',
      libraries: ['library'],
      filters: ['mine'],
      organisations: ['example organisation'],
      states: ['development'],
      search: 'search',
      task: 'task',
    }

    await searchModels(user, searchParams)
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }
    ModelModelMock.sort.mockResolvedValueOnce([])

    const searchParams: EntrySearchOptionsParams = {
      kind: 'model',
      libraries: [],
      filters: [],
      organisations: [],
      states: [],
      search: '',
      task: 'task',
    }

    await searchModels(user, searchParams)
  })

  test('searchModels > admin access without auth', async () => {
    const user = { dn: 'not admin' }
    const adminAccess = true
    authenticationMocks.hasRole.mockImplementation(() => false)

    const searchParams: EntrySearchOptionsParams = {
      kind: 'model',
      libraries: [],
      filters: [],
      organisations: [],
      states: [],
      search: '',
      task: 'task',
      adminAccess,
    }

    await expect(searchModels(user, searchParams)).rejects.toThrow('You do not have the required role.')
  })

  test('searchModels > admin access with auth', async () => {
    const user: any = { dn: 'admin' }
    const adminAccess = true
    ModelModelMock.sort.mockResolvedValueOnce([])
    authenticationMocks.hasRole.mockImplementation(() => true)

    const searchParams: EntrySearchOptionsParams = {
      kind: 'model',
      libraries: [],
      filters: [],
      organisations: [],
      states: [],
      search: '',
      task: 'task',
      adminAccess,
    }

    await searchModels(user, searchParams)
  })

  test('getModelCardRevision > should throw NotFound if modelCard does not exist', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1

    ModelCardRevisionModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^Version '.*' does not exist/,
    )
  })

  test('getModelCardRevision > should throw Forbidden if user does not have permission to view modelCard', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    ModelCardRevisionModelMock.findOne.mockResolvedValueOnce(mockModelCard)
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

    ModelCardRevisionModelMock.findOne.mockResolvedValueOnce(mockModelCard)

    const result = await getModelCardRevision(mockUser, mockModelId, mockVersion)

    expect(result).toEqual(mockModelCard)
  })

  test('_setModelCard > should throw Forbidden if user does not have write permission', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({ settings: { mirror: {} } })
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    vi.mocked(authorisation.model).mockImplementation(async (_user, _model, action) => {
      if (action === ModelAction.View) {
        return { success: true, id: '' }
      }
      if (action === ModelAction.Write) {
        return { success: false, info: 'You do not have permission to update this model card', id: '' }
      }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^You do not have permission to update this model card/,
    )
    expect(ModelCardRevisionModelMock.save).not.toHaveBeenCalled()
  })

  test('_setModelCard > should throw BadReq if the user tries to alter a mirrored model card', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: 'abc' } } })
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    vi.mocked(authorisation.model).mockImplementation(async (_user, _model, action) => {
      if (action === ModelAction.View) {
        return { success: true, id: '' }
      }
      if (action === ModelAction.Write) {
        return { success: false, info: 'Cannot alter a mirrored model.', id: '' }
      }
      if (action === ModelAction.Update) {
        return { success: false, info: 'Cannot alter a mirrored model.', id: '' }
      }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^Cannot alter a mirrored model./,
    )
    expect(ModelCardRevisionModelMock.save).not.toHaveBeenCalled()
  })

  test('_setModelCard > should save and update model card if user has write permission', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({ settings: { mirror: {} } })
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    const result = await _setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)

    expect(result).toBeDefined()
    expect(ModelCardRevisionModelMock.save).toHaveBeenCalled()
  })

  test('updateModelCard > should throw forbidden when user does not have permission to view the model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot alter a mirrored model.',
      success: false,
      id: '',
    })
    await expect(() => updateModelCard({} as any, '123', {} as any)).rejects.toThrow(/^Cannot alter a mirrored model./)
  })

  test('updateModelCard > should throw bad request when model has no card', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({ settings: { mirror: {} } })
    await expect(() => updateModelCard({} as any, '123', {} as any)).rejects.toThrow(
      /^This model must first be instantiated/,
    )
  })

  test('updateModelCard > should throw bad request when metadata fails schema validation', async () => {
    const mockModel = { settings: { mirror: {} }, card: { schemaId: 'test-schema', version: 1 } }
    ModelModelMock.findOne.mockResolvedValueOnce(mockModel)
    schemaMock.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [] })

    await expect(() => updateModelCard({} as any, '123', {} as any)).rejects.toThrow(
      /^Model metadata could not be validated against the schema./,
    )
  })

  test('updateModelCard > should throw bad request when metadata fails schema validation for a state', async () => {
    const mockModel = { state: 'Production', settings: { mirror: {} }, card: { schemaId: 'test-schema', version: 1 } }
    ModelModelMock.findOne.mockResolvedValueOnce(mockModel)
    schemaMock.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [] })

    await expect(() => updateModelCard({} as any, '123', {} as any)).rejects.toThrow(
      'Model metadata could not be validated against the schema, for Production state.',
    )
  })

  test('updateModelCard > should successfully update model card', async () => {
    const mockModel = { settings: { mirror: {} }, card: { schemaId: 'test-schema', version: 1 } }
    ModelModelMock.findOne.mockResolvedValueOnce(mockModel).mockResolvedValueOnce(mockModel)

    const result = await updateModelCard({} as any, '123', { key: 'value' })

    expect(result).toBeDefined()
    expect(ModelCardRevisionModelMock.save).toHaveBeenCalled()
  })

  test('updateModel > should throw bad request when attempting to change a standard model to be a mirrored model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot change standard model to be a mirrored model.',
      success: false,
      id: '',
    })
    await expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '', destinationModelId: '123' } } }),
    ).rejects.toThrow(/^Cannot change standard model to be a mirrored model./)
  })

  test('updateModel > should throw bad request when attempting to change a destinationModel ID to a mirrored model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot set a destination model ID for a mirrored model.',
      success: false,
      id: '',
    })
    await expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '', destinationModelId: '123' } } }),
    ).rejects.toThrow(/^Cannot set a destination model ID for a mirrored model./)
  })

  test('updateModel > should throw a bad request when attempting to select both standard and mirror model', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'You cannot select both mirror settings simultaneously.',
      success: false,
      id: '',
    })
    await expect(() =>
      updateModel({} as any, '123', { settings: { mirror: { sourceModelId: '123', destinationModelId: '234' } } }),
    ).rejects.toThrow(/^You cannot select both mirror settings simultaneously./)
  })

  test('updateModel > should throw an internal error if getUserInformation fails due to invalid user', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: 'abc' } } })
    authenticationMocks.getUserInformation.mockImplementation(() => {
      throw new Error('Unable to find user user:unknown_user')
    })
    await expect(() =>
      updateModel({} as any, '123', { collaborators: [{ entity: 'user:unknown_user', roles: [] }] }),
    ).rejects.toThrow(/^Unable to find user user:unknown_user/)
  })

  test('updateModel > throws an error when attempting to update an untrusted model to be public', async () => {
    const testModel = {
      name: 'untrusted model',
      kind: EntryKind.UntrustedModel,
      description: 'test',
      visibility: EntryVisibility.Private,
      collaborators: [],
      settings: { mirror: {}, ungovernedAccess: false, allowTemplating: false },
    }
    ModelModelMock.findOne.mockResolvedValueOnce(testModel)

    await expect(() => updateModel({} as any, 'test123', { visibility: EntryVisibility.Public })).rejects.toThrow(
      /^Untrusted models cannot be made public./,
    )
  })

  test('updateModel > throws an error when model card fails validation for new state', async () => {
    const testModel = {
      name: 'test model',
      kind: EntryKind.Model,
      card: {
        schemaId: 'test-schema',
        version: 1,
        metadata: { overview: { name: 'Test' } },
      },
    }
    ModelModelMock.findOne.mockResolvedValueOnce(testModel)
    schemaMock.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [] })

    await expect(() => updateModel({} as any, 'test123', { state: 'Production' })).rejects.toThrow(
      'Model metadata could not be validated against the schema, for Production state.',
    )
  })

  test('createModelCardFromSchema > should throw an error when attempting to change a model from mirrored to standard', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'Cannot alter a mirrored model.',
      success: false,
      id: '',
    })

    await expect(() => createModelCardFromSchema({} as any, '123', 'abc')).rejects.toThrow(
      /^Cannot alter a mirrored model./,
    )
    expect(ModelModelMock.save).not.toHaveBeenCalled()
  })

  test('setLatestImportedModelCard > success', async () => {
    const mockModelCard = { modelId: '123', version: 1 }
    const testModelForImport = { settings: { mirror: { sourceModelId: 'abc' } }, save: vi.fn() }
    ModelModelMock.findOne.mockResolvedValue(testModelForImport)
    ModelCardRevisionModelMock.findOne.mockResolvedValue(mockModelCard)
    await setLatestImportedModelCard('abc')

    expect(testModelForImport.save).toHaveBeenCalledOnce()
  })

  test('setLatestImportedModelCard > cannot find latest model card', async () => {
    ModelCardRevisionModelMock.findOne.mockResolvedValue(undefined)
    const result = setLatestImportedModelCard('abc')

    await expect(result).rejects.toThrow(/^Cannot find latest model card./)
  })

  test('setLatestImportedModelCard > cannot update model', async () => {
    ModelModelMock.findOne.mockResolvedValueOnce(undefined)
    const result = setLatestImportedModelCard('abc')

    await expect(result).rejects.toThrow(/^Unable to set latest model card of mirrored model./)
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

  test('createModelCardFromTemplate > can create a model using a template', async () => {
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
    ModelModelMock.findOne.mockResolvedValueOnce(testModel).mockResolvedValue(testTemplate)
    await createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')
    expect(ModelCardRevisionModelMock.save).toHaveBeenCalled()
    expect(ModelModelMock.updateOne).toHaveBeenCalled()
  })

  test('createModelCardFromTemplate > requesting to use a template without a model card will throw an error', async () => {
    const testModel = {
      name: 'test model',
      settings: {
        mirror: {},
      },
    }
    ModelModelMock.findOne.mockResolvedValue(testModel)
    await expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')).rejects.toThrow(
      /^The template model is missing a model card/,
    )
  })

  test('createModelCardFromTemplate > throw bad request when supplying the same template and model id', async () => {
    await expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testModel')).rejects.toThrow(
      'The model and template ID must be different',
    )
  })

  test('createModelCardFromTemplate > throw forbidden when user does not have access to template', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'User does not have access to model',
      success: false,
      id: '',
    })
    await expect(() => createModelCardFromTemplate({} as any, 'testModel', 'testTemplateModel')).rejects.toThrow(
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

    ModelModelMock.findOne.mockResolvedValueOnce('mocked')
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

    expect(ModelModelMock.findOne).toHaveBeenCalled()
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

    ModelModelMock.findOne.mockResolvedValueOnce('mocked')
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

    expect(ModelModelMock.findOne).toHaveBeenCalled()
    expect(permissions).toEqual(mockPermissions)
  })

  test('popularTagsForEntries > returns a list of tags', async () => {
    ModelModelMock.aggregate.mockResolvedValueOnce([{ _id: 'test-tag' }])
    const tags = await popularTagsForEntries()
    expect(tags).toEqual(['test-tag'])
  })

  test('getModelSystemRoles > should handle case-insensitive entity matching', async () => {
    const mockModel = {
      collaborators: [
        {
          entity: 'Bobs_User_Group',
          roles: ['owner'],
        },
      ],
    } as any

    const mockUser = { dn: 'user' } as any

    authenticationMocks.getEntities.mockResolvedValueOnce(['BOBS_USER_GROUP'])

    const response = await getModelSystemRoles(mockUser, mockModel)

    expect(response).toContain('owner')
  })

  test('getRoleEntities > basic mapping', () => {
    const roles = ['owner', 'contributor'] as const
    const collaborators = [
      { entity: 'user:alice', roles: ['owner'] },
      { entity: 'user:bob', roles: ['contributor'] },
    ]

    const result = getRoleEntities(roles, collaborators)

    expect(result).toEqual({
      owner: ['user:alice'],
      contributor: ['user:bob'],
    })
  })

  test('getRoleEntities > role with no matching collaborators returns empty array', () => {
    const roles = ['owner', 'reviewer'] as const
    const collaborators = [{ entity: 'user:alice', roles: ['owner'] }]

    const result = getRoleEntities(roles, collaborators)

    expect(result).toEqual({
      owner: ['user:alice'],
      reviewer: [],
    })
  })

  test('getRoleEntities > empty collaborators returns empty arrays for all roles', () => {
    const roles = ['owner', 'contributor'] as const
    const collaborators: { entity: string; roles: string[] }[] = []

    const result = getRoleEntities(roles, collaborators)

    expect(result).toEqual({
      owner: [],
      contributor: [],
    })
  })

  test('getRoleEntities > empty roles returns empty object', () => {
    const roles = [] as const
    const collaborators = [{ entity: 'user:alice', roles: ['owner'] }]

    const result = getRoleEntities(roles, collaborators)

    expect(result).toEqual({})
  })

  test('getRoleEntities > collaborator with multiple roles appears in all relevant role arrays', () => {
    const roles = ['owner', 'contributor'] as const
    const collaborators = [{ entity: 'user:alice', roles: ['owner', 'contributor'] }]

    const result = getRoleEntities(roles, collaborators)

    expect(result).toEqual({
      owner: ['user:alice'],
      contributor: ['user:alice'],
    })
  })
})
