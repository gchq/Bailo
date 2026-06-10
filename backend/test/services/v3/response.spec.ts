import { describe, expect, test, vi } from 'vitest'

import { Decision } from '../../../src/models/Response.js'
import { getLatestResponseForReview, newComment, respondToReview } from '../../../src/services/v3/response.js'
import { ReviewKind } from '../../../src/types/enums.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'
import { testReleaseReview, testResponse } from '../../testUtils/testModels.js'

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
  createLifecycleReview: vi.fn(),
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

const mockSchedulerService = vi.hoisted(() => ({
  cancelLifecycleReviewJobs: vi.fn(),
}))
vi.mock('../../../src/services/schedule/scheduler.js', () => mockSchedulerService)

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

  test('respondToReview > cancels lifecycle review jobs after saving response', async () => {
    reviewV3Mock.findReviewById.mockReturnValue(testReleaseReview as any)
    ReviewModel.aggregate.mockResolvedValue([{ modelId: testReleaseReview.modelId, role: 'owner' }])

    await respondToReview(user, '6a058ab4db7a3be341fb3cca', {
      decision: Decision.RequestChanges,
      comment: 'Do better!',
    })

    expect(mockSchedulerService.cancelLifecycleReviewJobs).toHaveBeenCalledWith(
      testReleaseReview.modelId,
      '6a058ab4db7a3be341fb3cca',
    )
  })

  test('find latest response for review > successful', async () => {
    ResponseModelMock.findOne.mockImplementation(() => ({
      sort: vi.fn().mockResolvedValue(testResponse),
    }))
    const latestResponse = await getLatestResponseForReview('6a058ab4db7a3be341fb3cca')
    expect(ResponseModelMock.findOne).toHaveBeenCalledOnce()
    expect(latestResponse.entity).toBe(testResponse.entity)
  })

  test('submit a comment on a release > successful', async () => {
    ResponseModelMock.save.mockReturnValue(testResponse)
    const releaseComment = await newComment({} as any, 'test-123', ReviewKind.Release, 'This is a comment', '1.0.0')
    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(releaseComment.comment).toBe('This is a comment')
  })

  test('submit a comment on a release without a semver identifier > unsuccessful', async () => {
    ResponseModelMock.save.mockReturnValue(testResponse)
    await expect(newComment({} as any, 'test-123', ReviewKind.Release, 'This is a comment')).rejects.toThrow(
      /^A valid semver must be provided for release comments./,
    )
  })

  test('submit a model card comment > successful', async () => {
    ResponseModelMock.save.mockReturnValue(testResponse)
    const releaseComment = await newComment({} as any, 'test-123', ReviewKind.Lifecycle, 'This is a comment')
    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(releaseComment.comment).toBe('This is a comment')
  })
})
