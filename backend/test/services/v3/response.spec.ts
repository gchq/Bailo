import { describe, expect, test, vi } from 'vitest'

import { Decision } from '../../../src/models/Response.js'
import { respondToReview } from '../../../src/services/v3/response.js'
import { ReviewKind } from '../../../src/types/enums.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'
import { testReleaseReview } from '../../testUtils/testModels.js'

vi.mock('../../../src/connectors/authorisation/index.js')
vi.mock('../../../src/connectors/authentication/index.js', async () => ({
  default: {
    getEntities: vi.fn(function () {
      return ['user:test']
    }),
  },
}))

const ResponseModelMock = getTypedModelMock('ResponseModel')

const reviewV3Mock = vi.hoisted(() => ({
  findReviewById: vi.fn(function () {
    return [testReleaseReview]
  }),
}))
vi.mock('../../../src/services/v3/review.js', async () => reviewV3Mock)

const responseV2Mock = vi.hoisted(() => ({
  sendReviewResponseNotification: vi.fn(),
}))
vi.mock('../../../src/services/response.js', async () => responseV2Mock)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../../src/services/webhook.js', () => mockWebhookService)

describe('services > v3 > response', () => {
  const user: any = { dn: 'test' }

  test('respondToReview > release successful', async () => {
    reviewV3Mock.findReviewById.mockReturnValue(testReleaseReview as any)
    await respondToReview(user, '6a058ab4db7a3be341fb3cca', 'modelId', 'msro', ReviewKind.Release, {
      decision: Decision.RequestChanges,
      comment: 'Do better!',
    })

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(responseV2Mock.sendReviewResponseNotification).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > access request successful', async () => {
    reviewV3Mock.findReviewById.mockReturnValue(testReleaseReview as any)
    await respondToReview(user, '6a058ab4db7a3be341fb3cca', 'modelId', 'msro', ReviewKind.Access, {
      decision: Decision.RequestChanges,
      comment: 'Do better!',
    })

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(responseV2Mock.sendReviewResponseNotification).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > lifecycle successful', async () => {
    reviewV3Mock.findReviewById.mockReturnValue(testReleaseReview as any)
    await respondToReview(
      user,
      '6a058ab4db7a3be341fb3cca',
      'modelId',
      'msro',
      ReviewKind.Lifecycle,
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      new Date().toISOString(),
    )

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(responseV2Mock.sendReviewResponseNotification).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })
})
