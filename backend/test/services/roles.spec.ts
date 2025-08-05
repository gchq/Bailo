import { describe, expect, test, vi } from 'vitest'

import ReviewRoleModel from '../../src/models/ReviewRole.js'
import { getAllEntryRoles } from '../../src/services/roles.js'
import { testAccessRequest, testReviewRoleNoCollaborator } from '../testUtils/testModels.js'

const modelModelMock = vi.hoisted(() => {
  const obj: any = { id: '123', card: {}, collaborators: [{ entity: 'user:user', roles: 'reviewer' }] }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => [obj])
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

vi.mock('../../src/models/Model.js', async () => ({
  ...((await vi.importActual('../../src/models/Model.js')) as object),
  default: modelModelMock,
}))

const accessRequestMock = vi.hoisted(() => {
  return {
    getAccessRequestsByModel: vi.fn(() => undefined as any),
  }
})
vi.mock('../../src/services/accessRequest.js', () => accessRequestMock)

const mockReviewService = vi.hoisted(() => {
  return {
    findReviewRoles: vi.fn(() => [testReviewRoleNoCollaborator]),
  }
})
vi.mock('../../src/services/review.js', () => mockReviewService)

describe('services > review', () => {
  test('getAllEntryRoles > gets default entry roles', async () => {
    const roles = await getAllEntryRoles({} as any)
    expect(roles.length).toBe(3)
  })

  test('getAllEntryRoles > gets all roles for an entry with no schema', async () => {
    modelModelMock.findOne.mockResolvedValue({
      id: '123',
      card: {},
      collaborators: [{ entity: 'user:user', roles: 'reviewer' }],
    })
    const roles = await getAllEntryRoles({} as any, '124')
    expect(roles.length).toBe(3)
  })

  test('getAllEntryRoles > gets all roles for an entry with review roles', async () => {
    modelModelMock.findOne.mockResolvedValue({
      id: '123',
      card: { schemaId: 'test' },
      collaborators: [{ entity: 'user:user', roles: 'reviewer' }],
    })
    const reviewRoleInterface = new ReviewRoleModel({
      ...testReviewRoleNoCollaborator,
      _id: 'test',
    })
    accessRequestMock.getAccessRequestsByModel.mockResolvedValue([testAccessRequest])
    mockReviewService.findReviewRoles.mockResolvedValueOnce([reviewRoleInterface])
    const roles = await getAllEntryRoles({} as any, '234')
    expect(roles.length).toBe(4)
  })
})
