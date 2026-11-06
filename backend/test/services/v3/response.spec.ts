import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Decision } from '../../../src/models/Response.js'
import { getLatestResponseForReview, respondToReview } from '../../../src/services/v3/response.js'
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

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z')

describe('services > v3 > response', () => {
  const user: any = { dn: 'test' }

  beforeEach(() => {
    vi.setSystemTime(FIXED_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

  test('respondToReview > creates new lifecycle review when dueDate provided', async () => {
    const lifecycleReview = { ...testReleaseReview, kind: ReviewKind.Lifecycle }
    reviewV3Mock.findReviewById.mockReturnValue(lifecycleReview as any)
    ReviewModel.aggregate.mockResolvedValue([{ modelId: lifecycleReview.modelId, role: 'owner' }])

    const dueDate = new Date('2026-01-02T00:00:00.000Z')
    await respondToReview(user, '6a058ab4db7a3be341fb3cca', { decision: Decision.Approve, comment: '' }, dueDate)

    expect(reviewV3Mock.createLifecycleReview).toHaveBeenCalledWith(user, lifecycleReview.modelId, dueDate)
  })

  test('respondToReview > does not create lifecycle review when no dueDate', async () => {
    const lifecycleReview = { ...testReleaseReview, kind: ReviewKind.Lifecycle }
    reviewV3Mock.findReviewById.mockReturnValue(lifecycleReview as any)
    ReviewModel.aggregate.mockResolvedValue([{ modelId: lifecycleReview.modelId, role: 'owner' }])

    await respondToReview(user, '6a058ab4db7a3be341fb3cca', {
      decision: Decision.Approve,
      comment: '',
    })

    expect(reviewV3Mock.createLifecycleReview).not.toHaveBeenCalled()
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
