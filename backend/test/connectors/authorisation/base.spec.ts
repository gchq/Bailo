import { describe, expect, test, vi } from 'vitest'

import { BasicAuthorisationConnector } from '../../../src/connectors/authorisation/base.js'
import { ModelDoc } from '../../../src/models/Model.js'
import { ReleaseDoc } from '../../../src/models/Release.js'
import { SchemaDoc } from '../../../src/models/Schema.js'
import { UserInterface } from '../../../src/models/User.js'

const mockAccessRequestService = vi.hoisted(() => ({
  getModelAccessRequestsForUser: vi.fn(),
}))
vi.mock('../../../src/services/v2/accessRequest.js', () => mockAccessRequestService)

const mockModelService = vi.hoisted(() => ({}))
vi.mock('../../../src/services/v2/model.js', () => mockModelService)

const mockReviewService = vi.hoisted(() => ({
  checkAccessRequestsApproved: vi.fn(),
}))
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

const mockAuthentication = vi.hoisted(() => ({
  getUserModelRoles: vi.fn(() => [] as Array<string>),
  hasRole: vi.fn(),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({ default: mockAuthentication }))

describe('connectors > authorisation > base', () => {
  const user = { dn: 'testUser' } as UserInterface
  const model = { id: 'testModel' } as ModelDoc

  test('hasApprovedAccessRequest > no access requests for model', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([])

    const result = await connector.hasApprovedAccessRequest(user, model)

    expect(result).toBe(false)
  })

  test('hasApprovedAccessRequest > return access request check', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([{ id: 'accessRequest' }])
    const approvedAccessRequest = true
    mockReviewService.checkAccessRequestsApproved.mockReturnValueOnce(approvedAccessRequest)

    const result = await connector.hasApprovedAccessRequest(user, model)

    expect(result).toBe(approvedAccessRequest)
  })

  test('hasModelVisibilityAccess > public model', async () => {
    const connector = new BasicAuthorisationConnector()

    const result = await connector.hasModelVisibilityAccess(user, { id: 'testModel', visibility: 'public' } as ModelDoc)

    expect(result).toBe(true)
  })

  test('hasModelVisibilityAccess > private model with no roles', async () => {
    const connector = new BasicAuthorisationConnector()

    const result = await connector.hasModelVisibilityAccess(user, {
      id: 'testModel',
      visibility: 'private',
    } as ModelDoc)

    expect(result).toBe(false)
  })

  test('hasModelVisibilityAccess > private model with roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.hasModelVisibilityAccess(user, {
      id: 'testModel',
      visibility: 'private',
    } as ModelDoc)

    expect(result).toBe(true)
  })

  test('model > private model with no roles', async () => {
    const connector = new BasicAuthorisationConnector()

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      'create',
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You cannot interact with a private model that you do not have access to.',
      success: false,
    })
  })

  test('model > private model with roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      'create',
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('schema > create schema as Admin', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockReturnValueOnce(true)

    const result = await connector.schema(user, { id: 'testSchema' } as SchemaDoc, 'create')

    expect(result).toStrictEqual({
      id: 'testSchema',
      success: true,
    })
  })

  test('schema > create schema not as an Admin', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockReturnValueOnce(false)

    const result = await connector.schema(user, { id: 'testSchema' } as SchemaDoc, 'create')

    expect(result).toStrictEqual({
      id: 'testSchema',
      info: 'You cannot upload or modify a schema if you are not an admin.',
      success: false,
    })
  })

  test('release > private model with roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      {} as ReleaseDoc,
      'create',
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('release > private model with no roles', async () => {
    const connector = new BasicAuthorisationConnector()

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      {} as ReleaseDoc,
      'create',
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You cannot interact with a private model that you do not have access to.',
      success: false,
    })
  })
})
