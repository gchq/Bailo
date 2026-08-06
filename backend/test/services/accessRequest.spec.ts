import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind } from '../../src/models/Model.js'
import { UserInterface } from '../../src/models/User.js'
import {
  createAccessRequest,
  findAccessRequests,
  getAccessRequestsByModel,
  getCurrentUserPermissionsByAccessRequest,
  getModelAccessRequestsForUser,
  newAccessRequestComment,
  removeAccessRequest,
  removeAccessRequests,
  updateAccessRequest,
} from '../../src/services/accessRequest.js'
import { AccessRequestUserPermissions } from '../../src/types/types.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')

const AccessRequestModelMock = getTypedModelMock('AccessRequestModel')
const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const schemaMocks = vi.hoisted(() => ({
  getSchemaById: vi.fn(),
  validateContentAgainstSchema: vi.fn(() => ({ valid: true, errors: [] })),
}))
vi.mock('../../src/services/schema.js', () => schemaMocks)

const mockAuthentication = vi.hoisted(() => ({
  hasRole: vi.fn(),
  getEntities: vi.fn(() => ['user:testUser']),
}))
vi.mock('../../src/connectors/authentication/index.js', () => ({ default: mockAuthentication }))

const mockReviewService = vi.hoisted(() => ({
  createAccessRequestReviews: vi.fn(),
  removeAccessRequestReviews: vi.fn(),
}))
vi.mock('../../src/services/review.js', () => mockReviewService)

const mockResponseService = vi.hoisted(() => ({
  removeResponsesByParentIds: vi.fn(),
}))
vi.mock('../../src/services/response.js', () => mockResponseService)

const mockWebhookService = vi.hoisted(() => ({
  dispatchWebhooks: vi.fn(),
}))
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

const accessRequest = {
  metadata: {
    overview: {
      name: 'example-access-request',
    },
  },
} as any

describe('services > accessRequest', () => {
  test('createAccessRequest > simple', async () => {
    modelMocks.getModelById.mockResolvedValue({ kind: EntryKind.Model } as any)
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    await createAccessRequest({} as any, 'example-model', accessRequest)

    expect(AccessRequestModelMock.save).toHaveBeenCalled()
    expect(AccessRequestModelMock).toHaveBeenCalled()
    expect(mockReviewService.createAccessRequestReviews).toHaveBeenCalled()
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalled()
  })

  test('createAccessRequest > bad authorisation', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      info: 'You do not have permission',
      success: false,
      id: '',
    })

    modelMocks.getModelById.mockResolvedValue({ kind: EntryKind.Model } as any)
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    await expect(() => createAccessRequest({} as any, 'example-model', accessRequest)).rejects.toThrow(
      /^You do not have permission/,
    )
  })

  test('createAccessRequest > bad request for untrusted model', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      info: 'You do not have permission',
      success: false,
      id: '',
    })

    modelMocks.getModelById.mockResolvedValue({ kind: EntryKind.UntrustedModel } as any)
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    await expect(() => createAccessRequest({} as any, 'example-model', accessRequest)).rejects.toThrow(
      'Cannot create an access request for an untrusted model.',
    )
  })

  test('createAccessRequest > update hidden schema', async () => {
    schemaMocks.getSchemaById.mockResolvedValue({ hidden: true })
    modelMocks.getModelById.mockResolvedValue({ kind: EntryKind.Model } as any)

    await expect(() => createAccessRequest({} as any, 'example-model', accessRequest)).rejects.toThrow(
      /^Cannot create new Access Request using a hidden schema./,
    )
  })

  test('createAccessRequest > validation error', async () => {
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })
    modelMocks.getModelById.mockResolvedValue({ kind: EntryKind.Model } as any)
    schemaMocks.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [] })

    await expect(() => createAccessRequest({} as any, 'test', {} as any)).rejects.toThrow(
      /^Access Request Metadata could not be validated against the schema./,
    )
  })

  test('getAccessRequestsByModel > good', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    AccessRequestModelMock.find.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }])
    vi.mocked(authorisation.accessRequests).mockResolvedValue([
      { info: 'You do not have permission', success: false, id: '' },
      { success: true, id: '' },
    ])

    const accessRequests = await getAccessRequestsByModel({} as any, 'modelId')
    expect(accessRequests).toMatchSnapshot()
  })

  test('findAccessRequests > no filters', async () => {
    mockAuthentication.hasRole.mockReturnValueOnce(false)
    AccessRequestModelMock.aggregate.mockResolvedValueOnce([
      {
        accessRequests: [
          {
            id: 'a',
          },
        ],
        model: {
          id: 'modelId',
        },
      },
    ])
    vi.mocked(authorisation.accessRequests).mockResolvedValue([{ success: true, id: 'a' }])

    const accessRequests = await findAccessRequests({} as any, [], '', true, false)
    expect(accessRequests).toMatchSnapshot()
  })

  test('findAccessRequests > all filters', async () => {
    mockAuthentication.hasRole.mockReturnValueOnce(false)
    AccessRequestModelMock.aggregate.mockResolvedValueOnce([
      {
        accessRequests: [
          {
            id: 'a',
          },
        ],
        model: {
          id: 'modelId',
        },
      },
    ])
    vi.mocked(authorisation.accessRequests).mockResolvedValue([{ success: true, id: 'a' }])

    const accessRequests = await findAccessRequests({} as any, ['modelId'], 'schemaId', false, false)
    expect(accessRequests).toMatchSnapshot()
  })

  test('findAccessRequests > admin access without auth', async () => {
    mockAuthentication.hasRole.mockReturnValueOnce(false)
    await expect(() => findAccessRequests({} as any, [], '', true, true)).rejects.toThrow(
      /^You do not have the required role./,
    )
  })

  test('findAccessRequests > admin access with auth', async () => {
    mockAuthentication.hasRole.mockReturnValueOnce(true)
    AccessRequestModelMock.aggregate.mockResolvedValueOnce([
      {
        accessRequests: [
          {
            id: 'a',
          },
        ],
      },
    ])

    const accessRequests = await findAccessRequests({} as any, [], '', true, true)
    expect(accessRequests).toMatchSnapshot()
  })

  test('removeAccessRequest > success', async () => {
    ReviewModelMock.find.mockResolvedValue([])
    ResponseModelMock.find.mockResolvedValue([])
    expect(await removeAccessRequest({} as any, 'test')).toMatchSnapshot()
  })

  test('removeAccessRequest > no permission', async () => {
    const mockAccessRequest = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    AccessRequestModelMock.findOne.mockResolvedValue(mockAccessRequest)

    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      success: false,
      info: 'You do not have permission to delete this access request.',
      id: '',
    })

    await expect(() => removeAccessRequest({} as any, 'test')).rejects.toThrow(
      /^You do not have permission to delete this access request./,
    )
  })

  test('removeAccessRequests > success', async () => {
    ReviewModelMock.find.mockResolvedValue([])
    ResponseModelMock.find.mockResolvedValue([])

    expect(await removeAccessRequests({} as any, ['test', 'test2'])).toMatchSnapshot()
    expect(ReviewModelMock.find).toHaveBeenCalledTimes(2)
    // Once in removeAccessRequests and twice in getAccessRequestById
    expect(modelMocks.getModelById).toHaveBeenCalledTimes(3)
  })

  test('removeAccessRequests > no permission', async () => {
    const mockAccessRequest = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    AccessRequestModelMock.findOne.mockResolvedValue(mockAccessRequest)

    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      success: false,
      info: 'You do not have permission to delete this access request.',
      id: '',
    })

    await expect(() => removeAccessRequests({} as any, ['test', 'test2'])).rejects.toThrow(
      /^You do not have permission to delete this access request./,
    )
  })

  test('getModelAccessRequestsForUser > query as expected', async () => {
    const user = { dn: 'testUser' } as UserInterface
    await getModelAccessRequestsForUser(user, 'test-model')

    expect(AccessRequestModelMock.find.mock.calls).matchSnapshot()
  })

  test('getCurrentUserPermissionsByAccessRequest > current user has all access request permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockAccessRequestId = '123'
    const mockPermissions: AccessRequestUserPermissions = {
      editAccessRequest: { hasPermission: true },
      deleteAccessRequest: { hasPermission: true },
    }

    AccessRequestModelMock.findOne.mockResolvedValueOnce('mocked')
    modelMocks.getModelById.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.accessRequest)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })

    const permissions = await getCurrentUserPermissionsByAccessRequest(mockUser, mockAccessRequestId)

    expect(AccessRequestModelMock.findOne).toHaveBeenCalled()
    expect(permissions).toEqual(mockPermissions)
  })

  test('getCurrentUserPermissionsByAccessRequest > current user has no access request permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockAccessRequestId = '123'
    const mockPermissions: AccessRequestUserPermissions = {
      editAccessRequest: { hasPermission: false, info: 'mocked' },
      deleteAccessRequest: { hasPermission: false, info: 'mocked' },
    }

    AccessRequestModelMock.findOne.mockResolvedValueOnce('mocked')
    modelMocks.getModelById.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.accessRequest)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })

    const permissions = await getCurrentUserPermissionsByAccessRequest(mockUser, mockAccessRequestId)

    expect(AccessRequestModelMock.findOne).toHaveBeenCalled()
    expect(permissions).toEqual(mockPermissions)
  })

  test('updateAccessRequest > success', async () => {
    const user = { dn: 'testUser' } as any

    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    await updateAccessRequest(user, 'test', {})

    expect(AccessRequestModelMock.save).toHaveBeenCalledOnce()
  })

  test('updateAccessRequest > with metadata', async () => {
    const user = { dn: 'testUser' } as any

    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })
    await updateAccessRequest(user, 'test', { metadata: { overview: { name: 'test', entities: user } } })

    expect(AccessRequestModelMock.markModified).toHaveBeenCalledOnce()
  })

  test('updateAccessRequest > no permission', async () => {
    const errorMessage = 'You cannot change an access request you do not own.'

    vi.mocked(authorisation.accessRequest).mockResolvedValue({
      info: errorMessage,
      success: false,
      id: '',
    })

    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })
    await expect(() => updateAccessRequest({} as any, 'test', {} as any)).rejects.toThrow(errorMessage)
  })

  test('updateAccessRequest > validation error', async () => {
    schemaMocks.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [] })

    await expect(() => updateAccessRequest({} as any, 'test', {} as any)).rejects.toThrow(
      /^Access Request Metadata could not be validated against the schema./,
    )
  })

  test('newAccessRequestComment > success', async () => {
    await newAccessRequestComment({} as any, 'test', 'message')

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
  })

  test('newAccessRequestComment > not found', async () => {
    AccessRequestModelMock.findOne.mockResolvedValue(undefined)

    await expect(() => newAccessRequestComment({} as any, 'test', 'message')).rejects.toThrow(
      /^The requested access request was not found./,
    )
  })
})
