import { describe, expect, test, vi } from 'vitest'

import { findReviewById } from '../../../src/services/v3/review.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'

const ReviewRoleModelMock = getTypedModelMock('ReviewRoleModel')

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../../src/services/model.js', async () => modelMock)

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviewById > can find a review using a given reviewId', async () => {
    modelMock.getModelById.mockResolvedValueOnce({
      id: 'test-1234',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
      save: vi.fn(),
    })
    await findReviewById(user, 'test-1234', '6a058a8a125dba342f0034a4', 'owner')
    expect(ReviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })
})
