import { describe, expect, test, vi } from 'vitest'

import {
  AccessRequestAction,
  FileAction,
  ModelAction,
  ReleaseAction,
  ResponseAction,
  ReviewRoleAction,
  SchemaAction,
  SchemaMigrationAction,
} from '../../../src/connectors/authorisation/actions.js'
import { BasicAuthorisationConnector, partials } from '../../../src/connectors/authorisation/base.js'
import { EntryKind, ModelDoc } from '../../../src/models/Model.js'
import { ReleaseDoc } from '../../../src/models/Release.js'
import { SchemaDoc } from '../../../src/models/Schema.js'
import { UserInterface } from '../../../src/models/User.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'
import { testReviewerWithOwnerSystemRole, testReviewRole } from '../../testUtils/testModels.js'

const ReviewRoleModelMock = getTypedModelMock('ReviewRoleModel')

const mockAccessRequestService = vi.hoisted(() => ({
  getModelAccessRequestsForUser: vi.fn(),
}))
vi.mock('../../../src/services/accessRequest.js', () => mockAccessRequestService)

const mockModelService = vi.hoisted(() => ({
  getModelSystemRoles: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => mockModelService)

const mockResponseService = vi.hoisted(() => ({
  checkAccessRequestsApproved: vi.fn(),
}))
vi.mock('../../../src/services/response.js', () => mockResponseService)

const mockAuthentication = vi.hoisted(() => ({
  getEntities: vi.fn(),
  hasRole: vi.fn(),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({ default: mockAuthentication }))

const mockEntityUtils = vi.hoisted(() => ({
  toEntity: vi.fn(),
}))
vi.mock('../../../src/utils/entity.js', () => mockEntityUtils)

const mockTokenService = vi.hoisted(() => ({
  validateTokenForModel: vi.fn(() => ({
    success: true,
  })),
  validateTokenForUse: vi.fn(() => ({ success: true })),
}))
vi.mock('../../../src/services/token.js', () => mockTokenService)

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

  test('accessRequests > not named, not owner, delete action', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.getEntities.mockResolvedValue(['entity1'])
    mockModelService.getModelSystemRoles.mockReturnValue(['consumer'])
    ReviewRoleModelMock.find.mockResolvedValue([])
    const ar = {
      id: 'ar1',
      metadata: { overview: { entities: ['entity2'] } },
    } as any

    const result = await connector.accessRequest(user, model as any, ar, AccessRequestAction.Delete)

    expect(result).toStrictEqual({
      id: 'ar1',
      success: false,
      info: 'You cannot change an access request you do not own.',
    })
  })

  test('hasModelVisibilityAccess > public model', async () => {
    const connector = new BasicAuthorisationConnector()

    const result = await connector.hasModelVisibilityAccess(user, { id: 'testModel', visibility: 'public' } as ModelDoc)

    expect(result).toBe(true)
  })

  test('hasModelVisibilityAccess > private model with no roles', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockReturnValue([])

    const result = await connector.hasModelVisibilityAccess(user, {
      id: 'testModel',
      visibility: 'private',
    } as ModelDoc)

    expect(result).toBe(false)
  })

  test('hasModelVisibilityAccess > private model with roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockModelService.getModelSystemRoles.mockReturnValue(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])

    const result = await connector.hasModelVisibilityAccess(user, {
      id: 'testModel',
      visibility: 'private',
    } as ModelDoc)

    expect(result).toBe(true)
  })

  test('responses > update when user is not author', async () => {
    const connector = new BasicAuthorisationConnector()
    mockEntityUtils.toEntity.mockReturnValue('differentEntity')

    const result = await connector.responses(user, [{ entity: 'otherEntity' } as any], ResponseAction.Update)

    expect(result).toStrictEqual([{ id: 'testUser', info: 'Only the author can update a comment', success: false }])
  })

  test('model > private model with no roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockModelService.getModelSystemRoles.mockResolvedValue([])

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
    mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])

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

  describe('Update model card', () => {
    test('model > update model card as owner', async () => {
      const connector = new BasicAuthorisationConnector()
      ReviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Write,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })

    test('model > update model card as contributor', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Write,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })

    test('model > update model card as consumer', async () => {
      const connector = new BasicAuthorisationConnector()
      ReviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['consumer'])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Write,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        info: 'You do not have permission to update a model card.',
        success: false,
      })
    })

    test('model > update model card as reviewer with owner permissions', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['reviewer'])
      ReviewRoleModelMock.find.mockResolvedValue([testReviewerWithOwnerSystemRole])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Write,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })
  })

  describe('Delete model card', () => {
    test('model > delete model card without owner role', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockResolvedValue(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])

      const result = await connector.model(user, model, ModelAction.Delete)

      expect(result).toStrictEqual({
        id: 'testModel',
        info: 'You do not have permission to delete a model card.',
        success: false,
      })
    })
  })

  describe('Update model', () => {
    test('model > update model as owner', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])
      ReviewRoleModelMock.find.mockResolvedValue([])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Update,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })

    test('model > update model as contributor', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Update,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        info: 'You do not have permission to update a model.',
        success: false,
      })
    })

    test('model > update model as consumer', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['consumer'])
      ReviewRoleModelMock.find.mockResolvedValue([])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Update,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        info: 'You do not have permission to update a model.',
        success: false,
      })
    })

    test('model > update model as review role with owner permissions', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['reviewer'])
      ReviewRoleModelMock.find.mockResolvedValue([testReviewerWithOwnerSystemRole])

      const result = await connector.model(
        user,
        {
          id: 'testModel',
          visibility: 'public',
        } as ModelDoc,
        ModelAction.Update,
      )

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })

    test('model > update model as non-owner but admin', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockResolvedValue(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])
      mockAuthentication.hasRole.mockResolvedValue(true)

      const result = await connector.model(user, model, ModelAction.Update)

      expect(result).toStrictEqual({
        id: 'testModel',
        success: true,
      })
    })
  })

  describe('Import model', () => {
    test('model > import model as owner', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > import model as contributor', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > import model as consumer', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['consumer'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > import model as reviewer without owner permissions', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValue(['reviewer'])
      ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])

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
  })

  describe('Export model', () => {
    test('model > export model as owner', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > export model as contributor', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > export model as consumer', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['consumer'])
      ReviewRoleModelMock.find.mockResolvedValue([])

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

    test('model > export model as reviewer without owner permissions', async () => {
      const connector = new BasicAuthorisationConnector()
      mockModelService.getModelSystemRoles.mockReturnValueOnce(['reviewer'])
      ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])

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

  test('schemaMigration > create without admin role', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockResolvedValue(false)

    const result = await connector.schemaMigration(user, { id: 'schemaMigration' } as any, SchemaMigrationAction.Create)

    expect(result).toStrictEqual({
      id: 'schemaMigration',
      info: 'You cannot upload a schema migration if you are not an admin.',
      success: false,
    })
  })

  test('releases > token failure', async () => {
    const connector = new BasicAuthorisationConnector()
    mockTokenService.validateTokenForModel.mockResolvedValueOnce({
      success: false,
      info: 'Token invalid',
      id: 'testModel',
    } as any)

    const result = await connector.releases(user, model, [], ReleaseAction.Create)

    expect(result).toStrictEqual([{ success: false, info: 'Token invalid', id: 'testModel' }])
  })

  test('release > private model with roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockModelService.getModelSystemRoles.mockResolvedValue(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])

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
    mockModelService.getModelSystemRoles.mockResolvedValue([])
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
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])

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
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])

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
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockReturnValueOnce(['contributor'])

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
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockReturnValueOnce(['owner'])

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

  test('files > upload with missing contributor/owner role', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockResolvedValue([])
    ReviewRoleModelMock.find.mockResolvedValue([])
    const file = { _id: { toString: () => 'file1' } }

    const result = await connector.file(user as any, model as any, file as any, FileAction.Upload)

    expect(result).toStrictEqual({
      id: 'file1',
      success: false,
      info: 'You do not have permission to upload a file.',
    })
  })

  test('files > download without approved access and missing roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockResponseService.checkAccessRequestsApproved.mockResolvedValue(false)
    mockModelService.getModelSystemRoles.mockResolvedValue([])
    ReviewRoleModelMock.find.mockResolvedValue([])
    const file = { _id: { toString: () => 'file1' } }
    const mockModel = { ...model, settings: { ungovernedAccess: false } }

    const result = await connector.file(user as any, mockModel as any, file as any, FileAction.Download)

    expect(result).toStrictEqual({
      id: 'file1',
      success: false,
      info: 'You need to have an approved access request or have permission to download a file.',
    })
  })

  test('files > update when missing roles', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockResolvedValue([])
    ReviewRoleModelMock.find.mockResolvedValue([])
    const file = { _id: { toString: () => 'file1' } }

    const result = await connector.file(user as any, model as any, file as any, FileAction.Update)

    expect(result).toStrictEqual({
      id: 'file1',
      success: false,
      info: 'You are missing the required roles in order to update tags on this file.',
    })
  })

  test('image > push with no roles', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])
    mockModelService.getModelSystemRoles.mockReturnValue([])
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
        info: 'You do not have permission to write to an image.',
        success: false,
      },
    ])
  })

  test('image > pull with no roles', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])
    mockModelService.getModelSystemRoles.mockReturnValue([])
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

  test('image > invalid action', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])
    mockModelService.getModelSystemRoles.mockReturnValue([])
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
          actions: ['delete', 'list', 'foo'] as any[],
        },
      ],
    )

    expect(result).toStrictEqual([
      {
        id: 'testModel',
        info: 'Unrecognised action included in the access request.',
        success: false,
      },
    ])
  })

  test('image > handle map error', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])
    mockModelService.getModelSystemRoles.mockReturnValue([])
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
          actions: {
            map: vi.fn(() => {
              throw Error('err')
            }),
          } as any,
        },
      ],
    )

    expect(result).toStrictEqual([
      {
        id: 'testModel',
        info: 'Error: err',
        success: false,
      },
    ])
  })

  test('image > no wildcard without admin', async () => {
    const connector = new BasicAuthorisationConnector()
    ReviewRoleModelMock.find.mockResolvedValue([testReviewRole])
    mockModelService.getModelSystemRoles.mockReturnValue([])
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
          actions: ['*'],
        },
      ],
    )

    expect(result).toStrictEqual([
      {
        id: 'testModel',
        info: 'No use of `*` action without an admin token.',
        success: false,
      },
    ])
  })

  test('image > wildcard with admin', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockResolvedValue(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([])

    const result = await connector.image(
      user as any,
      { id: 'testModel', kind: EntryKind.Model } as any,
      {
        type: 'repository',
        name: 'img1',
        actions: ['*'],
      },
      true,
    )

    expect(result).toStrictEqual({
      id: 'img1',
      success: true,
    })
  })

  test('image > constrained user token', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockResolvedValue(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([])
    mockTokenService.validateTokenForModel.mockResolvedValueOnce({
      success: false,
      info: 'Token invalid',
      id: 'testModel',
    } as any)

    const result = await connector.image(user as any, { id: 'testModel', kind: EntryKind.Model } as any, {
      type: 'repository',
      name: 'img1',
      actions: ['pull'],
    })

    expect(result).toStrictEqual({
      success: false,
      info: 'Token invalid',
      id: 'testModel',
    })
  })

  test('image > pull action allowed on mirrored model', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockResolvedValue([])
    mockModelService.getModelSystemRoles.mockResolvedValue(['owner'])
    ReviewRoleModelMock.find.mockResolvedValue([])

    const result = await connector.image(user as any, { id: 'testModel', kind: EntryKind.MirroredModel } as any, {
      type: 'repository',
      name: 'img1',
      actions: ['pull'],
    })

    expect(result).toStrictEqual({
      id: 'img1',
      success: true,
    })
  })

  test('reviewRoles > create without admin role', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAuthentication.hasRole.mockResolvedValue(false)

    const result = await connector.reviewRole(user as any, 'role1', ReviewRoleAction.Create)

    expect(result).toStrictEqual({
      id: 'role1',
      success: false,
      info: 'You cannot upload or modify a review role if you are not an admin.',
    })
  })

  test('partials > merges new responses into successes', async () => {
    const data = ['a', 'b', 'c']
    const responses = [
      { success: true, id: 'a' },
      { success: false, id: 'b', info: 'error' },
      { success: true, id: 'c' },
    ]
    const func = (items: Array<string>) => items.map((item) => ({ success: true, id: item.toUpperCase() }))

    const merged = await partials(data, responses as any, func as any)

    expect(merged).toStrictEqual([
      { success: true, id: 'A' },
      { success: false, id: 'b', info: 'error' },
      { success: true, id: 'C' },
    ])
  })

  test('partials > throws when function returns incorrect length', async () => {
    const data = ['a', 'b']
    const responses = [
      { success: true, id: 'a' },
      { success: true, id: 'b' },
    ]
    const func = () => [{ success: true, id: 'A' }]

    await expect(partials(data, responses as any, func as any)).rejects.toThrow(
      'The function did not return a response for every item.',
    )
  })
})
