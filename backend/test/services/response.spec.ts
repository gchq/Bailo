import { Types } from 'mongoose'
import { describe, expect, test, vi } from 'vitest'

import { Decision, ReactionKind } from '../../src/models/Response.js'
import {
  checkAccessRequestsApproved,
  checkReleaseApproved,
  findResponseById,
  getResponsesByParentIds,
  respondToReview,
  sendReviewResponseNotification,
  updateResponse,
  updateResponseReaction,
} from '../../src/services/response.js'
import { ReviewKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testAccessRequestReview, testReleaseReview } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/authentication/index.js', () => ({
  default: {
    getEntities: vi.fn(function () {
      return ['user:test']
    }),
  },
}))

const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

const smtpMock = vi.hoisted(() => ({
  notifyReviewResponseForAccess: vi.fn(function () {
    return Promise.resolve()
  }),
  notifyReviewResponseForRelease: vi.fn(function () {
    return Promise.resolve()
  }),
  notifyReleaseOnApproval: vi.fn(function () {
    return Promise.resolve()
  }),
  requestReviewForRelease: vi.fn(function () {
    return Promise.resolve()
  }),
  requestReviewForAccessRequest: vi.fn(function () {
    return Promise.resolve()
  }),
}))
vi.mock('../../src/services/smtp/smtp.js', () => smtpMock)

const reviewMock = vi.hoisted(() => ({
  findReviewsForAccessRequests: vi.fn(function () {
    return [testReleaseReview]
  }),
  findReviewForResponse: vi.fn(function () {
    return testReleaseReview
  }),
}))
vi.mock('../../src/services/review.js', () => reviewMock)

const accessRequestServiceMock = vi.hoisted(() => ({
  getAccessRequestById: vi.fn(),
}))
vi.mock('../../src/services/accessRequest.js', () => accessRequestServiceMock)

const releaseServiceMock = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(),
}))
vi.mock('../../src/services/release.js', () => releaseServiceMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', () => ({
  default: logMock,
}))
const arrayUtilMock = vi.hoisted(() => ({
  asyncFilter: vi.fn(),
}))
vi.mock('../../src/utils/array.js', () => arrayUtilMock)
const entityUtilMock = vi.hoisted(() => ({
  toEntity: vi.fn(),
}))
vi.mock('../../src/utils/entity.js', () => entityUtilMock)

const mockWebhookService = vi.hoisted(() => {
  return {
    dispatchWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

describe('services > response', () => {
  const user: any = { dn: 'test' }

  test('findResponseById > success', async () => {
    const validId = new Types.ObjectId()

    const mockResponse = { _id: validId }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    const result = await findResponseById(validId.toHexString())

    expect(result).toBe(mockResponse)
  })

  test('findResponseById > response not found', async () => {
    ResponseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(findResponseById('test')).rejects.toThrow('The requested response was not found.')
  })

  test('getResponsesByParentIds > success', async () => {
    const mockResponses = [{ _id: 'response' }]
    ResponseModelMock.find.mockResolvedValueOnce(mockResponses)
    const result = await getResponsesByParentIds(['507f1f77bcf86cd799439011'])
    expect(result).toBe(mockResponses)
  })

  test('getResponsesByParentIds > response not found', async () => {
    ResponseModelMock.find.mockResolvedValueOnce(undefined)

    await expect(getResponsesByParentIds(['507f1f77bcf86cd799439011'])).rejects.toThrow(
      'The requested response was not found.',
    )
  })

  test('updateResponse > success', async () => {
    const date = new Date(1970, 0, 1, 0)
    vi.setSystemTime(date)

    const mockResponse = { _id: 'response', entity: 'user:user', comment: 'test', save: vi.fn() }
    const mockUpdatedResponse = { ...mockResponse, comment: 'updated', commentEditedAt: date.toISOString() }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)
    entityUtilMock.toEntity.mockReturnValueOnce('user:user')

    const updatedResponse = await updateResponse({} as any, 'test', 'updated')

    expect(updatedResponse).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toHaveBeenCalled()
  })
  test('updateResponse > response not found', async () => {
    ResponseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(updateResponse({} as any, 'test', 'updated')).rejects.toThrow('The requested response was not found.')
  })
  test('updateResponse > invalid user', async () => {
    const mockResponse = { _id: 'response', entity: 'user:user', comment: 'test', save: vi.fn() }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    await expect(updateResponse({} as any, 'test', 'updated')).rejects.toThrow(
      'Only the original author can update a comment or review response.',
    )
  })

  test('updateResponseReaction > should add reaction when no reactions of the same kind exist', async () => {
    const mockResponse = { _id: 'response', reactions: [], save: vi.fn() }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
    }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toHaveBeenCalled()
  })
  test('updateResponseReaction > should remove user from reaction users array when a reaction of the same kind exists and user is present in users array', async () => {
    const mockResponse = {
      _id: 'response',
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
      save: vi.fn(),
    }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: [],
        },
      ],
    }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toHaveBeenCalled()
  })
  test(`updateResponseReaction > should add user to reaction users array when a reaction of the same kind exists and user is not present in users array`, async () => {
    const mockResponse = {
      _id: 'response',
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: [],
        },
      ],
      save: vi.fn(),
    }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
    }

    ResponseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toHaveBeenCalled()
  })
  test('updateResponseReaction > response not found', async () => {
    ResponseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(updateResponseReaction({} as any, 'test', ReactionKind.LIKE)).rejects.toThrow(
      'The requested response was not found.',
    )
  })

  test('respondToReview > release successful', async () => {
    releaseServiceMock.getReleaseBySemver.mockResolvedValueOnce({
      modelId: 'abc',
      semver: '3.0.3',
    })
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
    expect(releaseServiceMock.getReleaseBySemver).toHaveBeenCalledOnce()
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > access request successful', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce(testAccessRequestReview as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForAccess).toHaveBeenCalledOnce()
    expect(accessRequestServiceMock.getAccessRequestById).toHaveBeenCalledOnce()
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > unable to send notification due to missing access request ID', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce({ kind: 'access' } as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )

    expect(logMock.error).toHaveBeenCalledWith(
      { review: { kind: 'access' } },
      'Unable to send notification for review response. Cannot find access request ID.',
    )
  })

  test('respondToReview > log when failed to send access request response notification', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce(testAccessRequestReview as any)
    smtpMock.notifyReviewResponseForAccess.mockRejectedValueOnce('failed to send')
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(accessRequestServiceMock.getAccessRequestById).toHaveBeenCalledOnce()
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalledOnce()
    expect(logMock.warn).toHaveBeenCalledOnce()
  })

  test('respondToReview > log when failed to send release response notification', async () => {
    smtpMock.notifyReviewResponseForRelease.mockRejectedValueOnce('failed to send')
    releaseServiceMock.getReleaseBySemver.mockResolvedValueOnce({
      modelId: 'abc',
      semver: '3.0.3',
    })
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))

    expect(ResponseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
    expect(releaseServiceMock.getReleaseBySemver).toHaveBeenCalledOnce()
    expect(mockWebhookService.dispatchWebhooks).toHaveBeenCalledOnce()
    expect(logMock.warn).toHaveBeenCalledOnce()
  })

  test('respondToReview > missing semver', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce({ kind: 'release' } as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    expect(logMock.error).toHaveBeenCalledWith(
      {
        review: { kind: 'release' },
      },
      'Unable to send notification for review response. Cannot find semver.',
    )
  })

  test('respondToReview > no reviews found', async () => {
    reviewMock.findReviewForResponse.mockRejectedValueOnce('Unable to find Review to respond to')

    const result = respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    await expect(result).rejects.toThrow(`Unable to find Review to respond to`)
    expect(ResponseModelMock.save).not.toHaveBeenCalled()
  })

  test('checkAccessRequestsApproved > approved access request exists', async () => {
    reviewMock.findReviewsForAccessRequests.mockReturnValueOnce([{ role: 'msro' }, { role: 'random' }] as any)
    ResponseModelMock.find.mockReturnValueOnce(['approved'])

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(true)
    expect(reviewMock.findReviewsForAccessRequests.mock.calls).toMatchSnapshot()
  })

  test('checkAccessRequestsApproved > no approved access requests with a required role', async () => {
    reviewMock.findReviewsForAccessRequests.mockReturnValueOnce([{ role: 'random' }] as any)

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(false)
    expect(reviewMock.findReviewsForAccessRequests.mock.calls).toMatchSnapshot()
  })

  describe('checkReleaseApproved', () => {
    test('returns true when all reviews have approved latest response', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(2)

      const result = await checkReleaseApproved('modelId', '1.0.0')

      expect(result).toBe(true)
    })

    test('returns false when some reviews lack approval', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([{ _id: 'review1' }])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(2)

      const result = await checkReleaseApproved('modelId', '1.0.0')

      expect(result).toBe(false)
    })

    test('returns false when there are no reviews', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(0)

      const result = await checkReleaseApproved('modelId', '1.0.0')

      expect(result).toBe(false)
    })
  })

  describe('sendReviewResponseNotification', () => {
    test('calls notifyReleaseOnApproval when release becomes newly approved', async () => {
      const review = { ...testReleaseReview, kind: ReviewKind.Release } as any
      const reviewResponse = { entity: 'user:test', decision: 'approve', role: 'msro' } as any

      releaseServiceMock.getReleaseBySemver.mockResolvedValueOnce({
        modelId: 'abc',
        semver: '3.0.3',
      })
      ReviewModelMock.aggregate.mockResolvedValueOnce([])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(1)

      await sendReviewResponseNotification(review, reviewResponse, user, false)

      expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
      expect(smtpMock.notifyReleaseOnApproval).toHaveBeenCalledOnce()
    })

    test('does not call notifyReleaseOnApproval when release was already approved', async () => {
      const review = { ...testReleaseReview, kind: ReviewKind.Release } as any
      const reviewResponse = { entity: 'user:test', decision: 'approve', role: 'msro' } as any

      releaseServiceMock.getReleaseBySemver.mockResolvedValueOnce({
        modelId: 'abc',
        semver: '3.0.3',
      })
      ReviewModelMock.aggregate.mockResolvedValueOnce([])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(1)

      await sendReviewResponseNotification(review, reviewResponse, user, true)

      expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
      expect(smtpMock.notifyReleaseOnApproval).not.toHaveBeenCalled()
    })

    test('does not call notifyReleaseOnApproval when release is not fully approved', async () => {
      const review = { ...testReleaseReview, kind: ReviewKind.Release } as any
      const reviewResponse = { entity: 'user:test', decision: 'approve', role: 'msro' } as any

      releaseServiceMock.getReleaseBySemver.mockResolvedValueOnce({
        modelId: 'abc',
        semver: '3.0.3',
      })
      ReviewModelMock.aggregate.mockResolvedValueOnce([{ _id: 'unapproved' }])
      ReviewModelMock.countDocuments.mockResolvedValueOnce(2)

      await sendReviewResponseNotification(review, reviewResponse, user, false)

      expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
      expect(smtpMock.notifyReleaseOnApproval).not.toHaveBeenCalled()
    })
  })
})
