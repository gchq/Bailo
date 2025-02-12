import { describe, expect, test, vi } from 'vitest'

import { ModelAction, ReleaseAction, SchemaAction } from '../../../src/connectors/authorisation/actions.js'
import { BasicAuthorisationConnector } from '../../../src/connectors/authorisation/base.js'
import { ModelDoc } from '../../../src/models/Model.js'
import { ReleaseDoc } from '../../../src/models/Release.js'
import { SchemaDoc } from '../../../src/models/Schema.js'
import { UserInterface } from '../../../src/models/User.js'

const mockAccessRequestService = vi.hoisted(() => ({
  getModelAccessRequestsForUser: vi.fn(),
}))
vi.mock('../../../src/services/accessRequest.js', () => mockAccessRequestService)

const mockModelService = vi.hoisted(() => ({}))
vi.mock('../../../src/services/model.js', () => mockModelService)

const mockResponseService = vi.hoisted(() => ({
  checkAccessRequestsApproved: vi.fn(),
}))
vi.mock('../../../src/services/response.js', () => mockResponseService)

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
    mockResponseService.checkAccessRequestsApproved.mockReturnValueOnce(approvedAccessRequest)

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
      ModelAction.Create,
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
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      ModelAction.Create,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('model > import model as non-owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['contributor'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ModelAction.Import,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You do not have permission to import a model.',
      success: false,
    })
  })

  test('model > import model as owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ModelAction.Import,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('model > export model as non-owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['contributor'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ModelAction.Export,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You do not have permission to export a model.',
      success: false,
    })
  })

  test('model > export model as owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.model(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ModelAction.Export,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('schema > create schema as Admin', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockReturnValueOnce(true)

    const result = await connector.schema(user, { id: 'testSchema' } as SchemaDoc, SchemaAction.Create)

    expect(result).toStrictEqual({
      id: 'testSchema',
      success: true,
    })
  })

  test('schema > create schema not as an Admin', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockReturnValueOnce(false)

    const result = await connector.schema(user, { id: 'testSchema' } as SchemaDoc, SchemaAction.Create)

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
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'private',
      } as ModelDoc,
      ReleaseAction.Create,
      {} as ReleaseDoc,
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
      ReleaseAction.Create,
      {} as ReleaseDoc,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You cannot interact with a private model that you do not have access to.',
      success: false,
    })
  })

  test('release > import model with a release as non-owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['contributor'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ReleaseAction.Import,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You do not have permission to import a model.',
      success: false,
    })
  })

  test('release > import model with a release as owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ReleaseAction.Import,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('release > export model with a release as non-owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['contributor'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ReleaseAction.Export,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      info: 'You do not have permission to export a model.',
      success: false,
    })
  })

  test('release > export model with a release as owner', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getUserModelRoles.mockReturnValueOnce(['owner'])

    const result = await connector.release(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      ReleaseAction.Export,
    )

    expect(result).toStrictEqual({
      id: 'testModel',
      success: true,
    })
  })

  test('image > push with no roles', async () => {
    const connector = new BasicAuthorisationConnector()

    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([])

    const result = await connector.images(
      user,
      {
        id: 'testModel',
        visibility: 'public',
      } as ModelDoc,
      [
        {
          type: 'repository',
          name: 'testModel',
          actions: ['push'],
        },
      ],
    )
    expect(result).toStrictEqual([
      {
        id: 'testModel',
        info: 'You do not have permission to upload an image.',
        success: false,
      },
    ])
  })

  test('image > pull with no roles', async () => {
    const connector = new BasicAuthorisationConnector()

    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([])

    const result = await connector.images(
      user,
      {
        id: 'testModel',
        visibility: 'public',
        settings: { ungovernedAccess: false },
      } as ModelDoc,
      [
        {
          type: 'repository',
          name: 'testModel',
          actions: ['pull'],
        },
      ],
    )
    expect(result).toStrictEqual([
      {
        id: 'testModel',
        info: 'You need to have an approved access request to download an image.',
        success: false,
      },
    ])
  })
})
