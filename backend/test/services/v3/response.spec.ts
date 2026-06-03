import { describe, expect, test, vi } from 'vitest'

import { Decision } from '../../../src/models/Response.js'
import { respondToReview } from '../../../src/services/v3/response.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'
import { testReleaseReview } from '../../testUtils/testModels.js'

vi.mock('../../../src/connectors/authorisation/index.js')
vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: {
    getEntities: vi.fn(function () {
      return ['user:test']
    }),
  },
}))

const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReviewModel = getTypedModelMock('ReviewModel')

const reviewV3Mock = vi.hoisted(() => ({
  findReviewById: vi.fn(function () {
    return [testReleaseReview]
  }),
}))
vi.mock('../../../src/services/v3/review.js', () => reviewV3Mock)

const responseV2Mock = vi.hoisted(() => ({
  sendReviewResponseNotification: vi.fn(),
}))
vi.mock('../../../src/services/response.js', () => responseV2Mock)

const mockWebhookService = vi.hoisted(() => ({
  sendWebhooks: vi.fn(),
}))
vi.mock('../../../src/services/webhook.js', () => mockWebhookService)

describe('services > v3 > response', () => {
  const user: any = { dn: 'test' }

  test('respondToReview > successful', async () => {
    reviewV3Mock.findReviewById.mockReturnValue(testReleaseReview as any)
    ReviewModel.aggregate.mockResolvedValue([
      {
        modelId: 'test-1234',
        role: 'owner',
      },
    ])
    await respondToReview(user, '6a058ab4db7a3be341fb3cca', {
      decision: Decision.RequestChanges,
      comment: 'Do better!',
    })

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(responseV2Mock.sendReviewResponseNotification).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })
})
