import { describe, expect, test, vi } from 'vitest'

import { createReview, findReviewById } from '../../../src/services/v3/review.js'
import { ReviewKind } from '../../../src/types/enums.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'

const ReviewModel = getTypedModelMock('ReviewModel')

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const authMocks = vi.hoisted(() => ({
  default: {
    models: vi.fn(),
  },
}))
vi.mock('../../../src/connectors/authorisation/index.js', () => authMocks)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelSystemRoles: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMock)

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviewById > can find a review using a given reviewId', async () => {
    modelMock.getModelById.mockResolvedValueOnce([
      {
        id: 'test-1234',
        collaborators: [{ entity: 'user:user', roles: ['owner'] }],
        save: vi.fn(),
      },
    ])
    ReviewModel.at.mockResolvedValue({
      modelId: 'test-1234',
      role: 'owner',
    })
    const review = await findReviewById(user, '6a058a8a125dba342f0034a4')
    expect(review).toMatchSnapshot()
  })

  test('createReview > create lifecycle review', async () => {
    modelMock.getModelById.mockResolvedValueOnce({
      id: 'test-1234',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
      save: vi.fn(),
    })
    modelMock.getModelSystemRoles.mockReturnValue(['owner'])
    ReviewModel.aggregate.mockResolvedValue([
      {
        modelId: 'test-1234',
        role: 'owner',
      },
    ])
    ReviewModel.findOne.mockResolvedValueOnce({
      modelId: 'test-1234',
      role: 'owner',
      delete: vi.fn(),
    })
    authMocks.default.models.mockResolvedValueOnce([{ success: true } as any])
    const newReview = await createReview({} as any, 'test-1234', {
      kind: ReviewKind.Lifecycle,
      dueDate: new Date('2026-05-28T12:54:03.780Z'),
    })
    expect(newReview).toMatchSnapshot()
  })
})
