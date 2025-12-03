import { describe, expect, test, vi } from 'vitest'

import ReviewRoleModel from '../../src/models/ReviewRole.js'
import { getAllEntryRoles } from '../../src/services/roles.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testAccessRequest, testReviewRoleNoSystemRole } from '../testUtils/testModels.js'

const ModelModelMock = getTypedModelMock('ModelModel')

const accessRequestMock = vi.hoisted(() => {
  return {
    getAccessRequestsByModel: vi.fn(() => undefined as any),
  }
})
vi.mock('../../src/services/accessRequest.js', () => accessRequestMock)

const mockReviewService = vi.hoisted(() => {
  return {
    findReviewRoles: vi.fn(() => [testReviewRoleNoSystemRole]),
  }
})
vi.mock('../../src/services/review.js', () => mockReviewService)

const configMock = vi.hoisted(
  () =>
    ({
      ui: {
        roleDisplayNames: {
          owner: 'Owner',
          contributor: 'Contributor',
          consumer: 'Consumer',
        },
      },
      log: {
        level: 'info',
      },
      instrumentation: {
        enabled: true,
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('services > review', () => {
  test('getAllEntryRoles > gets default entry roles', async () => {
    const roles = await getAllEntryRoles({} as any)
    expect(roles.length).toBe(3)
  })

  test('getAllEntryRoles > gets all roles for an entry with no schema', async () => {
    ModelModelMock.findOne.mockResolvedValue({
      id: '123',
      card: {},
      collaborators: [{ entity: 'user:user', roles: 'reviewer' }],
    })
    const roles = await getAllEntryRoles({} as any, '124')
    expect(roles.length).toBe(3)
  })

  test('getAllEntryRoles > gets all roles for an entry with review roles', async () => {
    ModelModelMock.findOne.mockResolvedValue({
      id: '123',
      card: { schemaId: 'test' },
      collaborators: [{ entity: 'user:user', roles: 'reviewer' }],
    })
    const reviewRoleInterface = new ReviewRoleModel({
      ...testReviewRoleNoSystemRole,
      _id: 'test',
    })
    accessRequestMock.getAccessRequestsByModel.mockResolvedValue([testAccessRequest])
    mockReviewService.findReviewRoles.mockResolvedValueOnce([reviewRoleInterface])
    const roles = await getAllEntryRoles({} as any, '234')
    expect(roles.length).toBe(4)
  })
})
