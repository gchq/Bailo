import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { UserInterface } from '../../src/models/User.js'
import {
  createAccessRequest,
  getAccessRequestsByModel,
  getCurrentUserPermissionsByAccessRequest,
  getModelAccessRequestsForUser,
  removeAccessRequest,
} from '../../src/services/accessRequest.js'
import { AccessRequestUserPermissions } from '../../src/types/types.js'

vi.mock('../../src/connectors/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const schemaMocks = vi.hoisted(() => ({
  getSchemaById: vi.fn(),
}))
vi.mock('../../src/services/schema.js', () => schemaMocks)

const accessRequestModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.find = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/AccessRequest.js', () => ({ default: accessRequestModelMocks }))

const mockReviewService = vi.hoisted(() => {
  return {
    createAccessRequestReviews: vi.fn(),
  }
})
vi.mock('../../src/services/review.js', () => mockReviewService)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
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
    modelMocks.getModelById.mockResolvedValue(undefined)
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    await createAccessRequest({} as any, 'example-model', accessRequest)

    expect(accessRequestModelMocks.save).toBeCalled()
    expect(accessRequestModelMocks).toBeCalled()
    expect(mockReviewService.createAccessRequestReviews).toBeCalled()
    expect(mockWebhookService.sendWebhooks).toBeCalled()
  })

  test('createAccessRequest > bad authorisation', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      info: 'You do not have permission',
      success: false,
      id: '',
    })

    modelMocks.getModelById.mockResolvedValue(undefined)
    schemaMocks.getSchemaById.mockResolvedValue({ jsonSchema: {} })

    expect(() => createAccessRequest({} as any, 'example-model', accessRequest)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('getAccessRequestsByModel > good', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    accessRequestModelMocks.find.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }])
    vi.mocked(authorisation.accessRequests).mockResolvedValue([
      { info: 'You do not have permission', success: false, id: '' },
      { success: true, id: '' },
    ])

    const accessRequests = await getAccessRequestsByModel({} as any, 'modelId')
    expect(accessRequests).toMatchSnapshot()
  })

  test('removeAccessRequest > success', async () => {
    expect(await removeAccessRequest({} as any, 'test')).toStrictEqual({ accessRequestId: 'test' })
  })

  test('removeAccessRequest > no permission', async () => {
    const mockAccessRequest = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    accessRequestModelMocks.findOne.mockResolvedValue(mockAccessRequest)

    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      success: false,
      info: 'You do not have permission to delete this access request.',
      id: '',
    })

    expect(() => removeAccessRequest({} as any, 'test')).rejects.toThrowError(
      /^You do not have permission to delete this access request./,
    )
  })

  test('getModelAccessRequestsForUser > query as expected', async () => {
    const user = { dn: 'testUser' } as UserInterface
    await getModelAccessRequestsForUser(user, 'test-model')

    expect(accessRequestModelMocks.find.mock.calls).matchSnapshot()
  })

  test('getCurrentUserPermissionsByAccessRequest > current user has all access request permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockAccessRequestId = '123'
    const mockPermissions: AccessRequestUserPermissions = {
      editAccessRequest: { hasPermission: true },
      deleteAccessRequest: { hasPermission: true },
    }

    accessRequestModelMocks.findOne.mockResolvedValueOnce('mocked')
    modelMocks.getModelById.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.accessRequest)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: true, id: '' })

    const permissions = await getCurrentUserPermissionsByAccessRequest(mockUser, mockAccessRequestId)

    expect(accessRequestModelMocks.findOne).toBeCalled()
    expect(permissions).toEqual(mockPermissions)
  })

  test('getCurrentUserPermissionsByAccessRequest > current user has no access request permissions', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockAccessRequestId = '123'
    const mockPermissions: AccessRequestUserPermissions = {
      editAccessRequest: { hasPermission: false, info: 'mocked' },
      deleteAccessRequest: { hasPermission: false, info: 'mocked' },
    }

    accessRequestModelMocks.findOne.mockResolvedValueOnce('mocked')
    modelMocks.getModelById.mockResolvedValueOnce('mocked')
    vi.mocked(authorisation.accessRequest)
      .mockResolvedValueOnce({ success: true, id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })
      .mockResolvedValueOnce({ success: false, info: 'mocked', id: '' })

    const permissions = await getCurrentUserPermissionsByAccessRequest(mockUser, mockAccessRequestId)

    expect(accessRequestModelMocks.findOne).toBeCalled()
    expect(permissions).toEqual(mockPermissions)
  })
})
