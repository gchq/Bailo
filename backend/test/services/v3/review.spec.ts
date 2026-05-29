import { describe, expect, test, vi } from 'vitest'

import { findReviewById } from '../../../src/services/v3/review.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'

const ReviewModel = getTypedModelMock('ReviewModel')

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
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
})
