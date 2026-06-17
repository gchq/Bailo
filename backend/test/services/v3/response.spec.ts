import { describe, expect, test, vi } from 'vitest'

import { Decision } from '../../../src/models/Response.js'
import { getLatestResponseForReview, respondToReview } from '../../../src/services/v3/response.js'
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

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelSystemRoles: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMock)

const mockWebhookService = vi.hoisted(() => ({
  dispatchWebhooks: vi.fn(),
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
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalledOnce()
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
})
